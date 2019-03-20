import * as http from "http"
import * as net from "net"
import parseURL from "parseurl"
import qs from "querystring"
import * as stream from "stream"
import * as tls from "tls"
import { Url } from "url"

// TODO: Delegate response methods (<https://github.com/koajs/koa/blob/master/lib/context.js#L213>)

type ParsedURL = Url

const $parsedQuery = Symbol("parsedQuery")
const $parsedURL = Symbol("parsedURL")

function getParsedQuery(request: Request): { [name: string]: string | string[] } {
  if (!request[$parsedQuery]) {
    const url = getParsedURL(request)
    request[$parsedQuery] = qs.parse((url.query || "") as string)
  }
  return request[$parsedQuery] as qs.ParsedUrlQuery
}

function getParsedURL(request: Request): ParsedURL {
  if (!request[$parsedURL]) {
    request[$parsedURL] = parseURL(request.rawRequest) || {}
  }
  return request[$parsedURL] as ParsedURL
}

function streamToBuffer(stream: stream.Readable) {
  return new Promise<Buffer>((resolve, reject) => {
    const buffers: Buffer[] = []
    let totalSize = 0

    stream.on('error', reject)
    stream.on('data', (chunk: Buffer) => {
      buffers.push(chunk)
      totalSize += chunk.byteLength
    })
    stream.on('end', () => resolve(Buffer.concat(buffers, totalSize)))
  })
}

function toArray<T>(thing: T | T[] | undefined | null): T[] {
  if (Array.isArray(thing)) {
    return thing
  } else {
    return thing !== undefined && thing !== null ? [thing] : []
  }
}

export interface Request<
  Query extends { [name: string]: string | string[] } = { [name: string]: string | string[] }
> {
  [$parsedQuery]: Query | null
  [$parsedURL]: ParsedURL | null
  readonly encrypted: boolean
  readonly headers: http.OutgoingHttpHeaders
  readonly method: string
  readonly url: string
  readonly rawHeaders: string[]
  readonly rawRequest: http.IncomingMessage
  readonly rawTrailers: string[]
  readonly socket: net.Socket | tls.TLSSocket

  buffer(): Promise<Buffer>
  get(headerName: string): string | undefined
  getAll(headerName: string): string[]
  path(): string
  query(): Query
  stream(): stream.Readable
}

const requestPrototype: Pick<Request, "buffer" | "get" | "getAll" | "path" | "query" | "stream"> = {
  buffer(this: Request) {
    return streamToBuffer(this.stream())
  },
  get(this: Request, headerName: string) {
    const values = this.getAll(headerName)
    return values.length > 0 ? values[values.length - 1] : undefined
  },
  getAll(this: Request, headerName: string) {
    const key = headerName.toLowerCase()
    const { headers } = this.rawRequest

    switch (key) {
      case "referer":
      case "referrer":
        return toArray(headers.referrer || headers.referer)
      default:
        return toArray(headers[key])
    }
  },
  path(this: Request) {
    const parsedURL = getParsedURL(this)
    return parsedURL.pathname as string
  },
  query(this: Request) {
    const parsedQuery = getParsedQuery(this)
    return parsedQuery
  },
  stream(this: Request) {
    return this.rawRequest
  }
}

export function Request(req: http.IncomingMessage): Request {
  return Object.create(requestPrototype, {
    [$parsedQuery]: {
      enumerable: false,
      writable: true,
      value: null
    },
    [$parsedURL]: {
      enumerable: false,
      writable: true,
      value: null
    },
    encrypted: {
      enumerable: true,
      writable: false,
      value: (req.socket as tls.TLSSocket).encrypted || false
    },
    headers: {
      enumerable: true,
      writable: false,
      value: req.headers
    },
    method: {
      enumerable: true,
      writable: false,
      value: req.method
    },
    url: {
      enumerable: true,
      writable: false,
      value: req.url
    },
    rawHeaders: {
      enumerable: true,
      writable: false,
      value: req.rawHeaders
    },
    rawRequest: {
      enumerable: true,
      writable: false,
      value: req
    },
    rawTrailers: {
      enumerable: true,
      writable: false,
      value: req.rawTrailers
    },
    socket: {
      enumerable: true,
      writable: false,
      value: req.socket
    }
  })
}
