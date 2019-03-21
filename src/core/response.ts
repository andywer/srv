import DebugLogger from "debug"
import * as http from "http"
import statuses from "statuses"
import * as stream from "stream"
import { Request } from "./request"
import { deriveImmutable } from "./util"

// TODO: Delegate response methods (<https://github.com/koajs/koa/blob/master/lib/context.js#L191>)

export type Headers = {
  [name in keyof http.IncomingHttpHeaders]: number | string | string[] | undefined
}

export interface ResponseOptions<
  Status extends number = number,
  Body extends string | Buffer | stream.Readable = string | Buffer | stream.Readable,
  Head extends Headers = Headers
> {
  body?: Body
  headers?: Head
  status?: Status
}

export interface Response<
  Status extends number = number,
  Body extends Buffer | stream.Readable = Buffer | stream.Readable,
  Head extends Headers = Headers
> {
  body?: Body
  headers?: Head
  skip?: boolean
  status: Status

  derive<
    NewStatus extends number = number,
    NewBody extends Buffer | stream.Readable = Buffer | stream.Readable,
    NewHead extends Headers = Head
  >(
    options: Partial<ResponseOptions<NewStatus, NewBody, NewHead>>
  ): Response<NewStatus, NewBody, NewHead>
}

type JSONResponse<
  Status extends number = number,
  Body extends any = any,
  Head extends Headers = Headers
> = Response<Status, Buffer, Head>

type SkipResponse = Response & { skip: true, status: 200 }

interface ResponseCreators {
  Binary<Status extends number, Head extends Headers>
    (blob: Buffer, options?: ResponseOptions<Status, never, Head>): Response<Status, Buffer, Head>
  Binary<Status extends number>(status: number, blob: Buffer): Response<Status>
  Binary<Status extends number>(status: number, headers: Headers, blob: Buffer): Response<Status>

  JSON<Status extends number, Body, Head extends Headers>
    (data: any, options?: ResponseOptions<Status, never, Head>): JSONResponse<Status, Body, Head>
  JSON<Status extends number>(status: number, data: any): Response<Status>
  JSON<Status extends number>(status: number, headers: Headers, data: any): Response<Status>

  Stream<Status extends number, Head extends Headers>
    (stream: stream.Readable, options?: ResponseOptions<Status, never, Head>): Response<Status, stream.Readable, Head>
  Stream<Status extends number>(status: number, stream: stream.Readable): Response<Status>
  Stream<Status extends number>(status: number, headers: Headers, stream: stream.Readable): Response<Status>

  Text<Status extends number, Head extends Headers>
    (data: string, options?: ResponseOptions<Status, never, Head>): Response<Status, Buffer, Head>
  Text<Status extends number>(status: Status, data: string): Response<Status>
  Text<Status extends number>(status: Status, headers: Headers, data: string): Response<Status>

  NotFound(request: Request): Response<404>
  Redirect(url: string): Response<302>
  Skip(): SkipResponse
}

const debug = DebugLogger("srv:response")

const isStream = (thing: any): thing is stream.Readable => thing && typeof thing === "object" && typeof thing.pipe === "function"

function getTextContentType(text: string) {
  return text.match(/^<!doctype html>/i) || text.match(/^<html[> ]/i)
    ? "text/html; charset=utf8"
    : "text/plain; charset=utf8"
}

const ResponseBase: Pick<Response, "derive"> = {
  derive<
    NewStatus extends number = number,
    NewBody extends Buffer | stream.Readable = Buffer | stream.Readable,
    NewHead extends Headers = Headers
  >(
    this: Response,
    options: Partial<ResponseOptions<NewStatus, NewBody, NewHead>>
  ): Response<NewStatus, NewBody, NewHead> {
    return deriveImmutable(this, options)
  }
}

export const Response = function Response<
  Status extends number,
  Body extends Buffer | stream.Readable,
  Head extends Headers
>(options: ResponseOptions<Status, Body, Head>) {
  const body = options.body
  let headers = options.headers || {} as Head

  if (Buffer.isBuffer(body) && !("Content-Length" in headers)) {
    headers = {
      ...headers,
      "Content-Length": body.byteLength
    }
  }

  return deriveImmutable(ResponseBase, {
    status: 200,
    headers,
    ...options
  }) as Response<Status, Body, Head>
} as (
  <
    Status extends number,
    Body extends Buffer | stream.Readable,
    Head extends Headers
  >(options: ResponseOptions<Status, Body, Head>) => Response<Status, Body, Head>
) & ResponseCreators

Response.Binary = function Binary(
  first: number | Buffer,
  second?: Buffer | Headers | ResponseOptions,
  third?: Buffer
): Response<number, Buffer, Headers> {
  if (typeof first === "number" && Buffer.isBuffer(second) && !third) {
    return Response({
      body: second,
      headers: {
        "Content-Type": "application/octet-stream"
      },
      status: first
    })
  } else if (typeof first === "number" && third) {
    return Response({
      body: third,
      headers: {
        "Content-Type": "application/octet-stream",
        ...(second as Headers)
      },
      status: first
    })
  } else if (Buffer.isBuffer(first)) {
    return Response({
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream"
      },
      ...(second as ResponseOptions<number, never, Headers>),
      body: first
    })
  } else {
    throw Error("Response.Binary(): Argument error")
  }
}

Response.JSON = function JSONResponse<Data>(
  first: number | Data,
  second?: Data | Headers | ResponseOptions,
  third?: Data
): JSONResponse<number, Data, Headers> {
  if (typeof first === "number" && !third) {
    return Response({
      body: Buffer.from(JSON.stringify(second), "utf8"),
      headers: {
        "Content-Type": "application/json; charset=utf8"
      },
      status: first
    })
  } else if (typeof first === "number" && third) {
    return Response({
      body: Buffer.from(JSON.stringify(third), "utf8"),
      headers: {
        "Content-Type": "application/json; charset=utf8",
        ...(second as Headers)
      },
      status: first
    })
  } else if (typeof first !== "undefined" && typeof first !== "function") {
    return Response({
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf8"
      },
      ...(second as ResponseOptions<number, never, Headers>),
      body: Buffer.from(JSON.stringify(first), "utf8")
    })
  } else {
    throw Error(`Response.JSON(): Argument error. First argument: ${first}`)
  }
}

Response.Stream = function Stream(
  first: number | stream.Readable,
  second?: stream.Readable | Headers | ResponseOptions,
  third?: stream.Readable
): Response<number, stream.Readable, Headers> {
  if (typeof first === "number" && isStream(second) && !third) {
    return Response({
      body: second,
      status: first
    })
  } else if (typeof first === "number" && third) {
    return Response({
      body: third,
      headers: second as Headers,
      status: first
    })
  } else if (isStream(first)) {
    return Response({
      status: 200,
      ...(second as ResponseOptions<number, never, Headers>),
      body: first
    })
  } else {
    throw Error("Response.Stream(): Argument error")
  }
}

Response.Text = function Text(
  first: number | string,
  second?: string | Headers | ResponseOptions,
  third?: string
): Response<number, Buffer, Headers> {
  if (typeof first === "number" && typeof second === "string" && !third) {
    return Response({
      body: Buffer.from(second, "utf8"),
      headers: {
        "Content-Type": getTextContentType(second)
      },
      status: first
    })
  } else if (typeof first === "number" && third) {
    return Response({
      body: Buffer.from(third, "utf8"),
      headers: {
        "Content-Type": getTextContentType(third),
        ...(second as Headers)
      },
      status: first
    })
  } else if (typeof first === "string") {
    return Response({
      status: 200,
      headers: {
        "Content-Type": getTextContentType(first)
      },
      ...(second as ResponseOptions<number, never, Headers>),
      body: Buffer.from(first, "utf8")
    })
  } else {
    throw Error("Response.Text(): Argument error")
  }
}

Response.NotFound = function NotFound(request: Request) {
  return Response({
    body: Buffer.from(`Not found: ${request.url}`, "utf8"),
    status: 404
  })
}

Response.Redirect = function Redirect(url: string) {
  // TODO: If client accepts HTML, send HTML
  const text = `Redirecting to ${url}.`
  return Response.Text(302, { "Location": url }, text)
}

const skipResponse: SkipResponse = (function createSkipResponse() {
  const response = Response({
    status: 200
  })
  response.skip = true
  return response as SkipResponse
})()

Response.Skip = function Skip() {
  // No need to create a new response every time Response.Skip() is called
  return skipResponse
}

export function applyResponseTo(response: Response, res: http.ServerResponse) {
  const body = response.body
  const headers = response.headers || {}

  res.statusCode = response.status
  res.statusMessage = statuses[response.status] || res.statusMessage

  for (const headerName of Object.keys(headers)) {
    const headerValue = headers[headerName]
    if (typeof headerValue !== "undefined") {
      res.setHeader(headerName, headerValue)
    }
  }

  if (body && statuses.empty[response.status]) {
    debug(Error(`Warning: Response body defined on a ${response.status} response.`))
  } else if (!body && !statuses.empty[response.status]) {
    debug(Error(`Warning: No response body defined on a ${response.status} response.`))
  }

  if (Buffer.isBuffer(body)) {
    return res.end(body)
  } else if (isStream(body)) {
    return body.pipe(res)
  } else if (body) {
    throw Error(`Unexpected Response.body: ${body}`)
  } else {
    return res.end()
  }
}
