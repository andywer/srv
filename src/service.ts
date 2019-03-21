import * as http from "http"
import stoppable from "stoppable"
import { Request } from "./core/request"
import { applyResponseTo, Response } from "./core/response"
import { assertRoute, Route } from "./core/route"
import { Router } from "./core/router"
import { DefaultErrorMiddleware } from "./middlewares/error"
import { HttpRequestHandler, Middleware } from "./types"

export interface Service {
  readonly middlewares: Middleware[]
  readonly router: Route

  handler(onUnhandledError?: (error: Error) => void): HttpRequestHandler
  listen(port?: number, host?: string): Promise<stoppable.StoppableServer>
}

export interface ServiceOptions {
  gracefulCloseTimeout?: number,
}

const defaultMiddlewares: Middleware[] = [
  DefaultErrorMiddleware
]

function assertMiddleware(middleware: any): Middleware {
  if (middleware && typeof middleware === "function") {
    return middleware
  } else {
    throw Error(`Expected a middleware function, but got: ${middleware}`)
  }
}

function createRequestHandler(stack: Middleware[], onUnhandledError: (error: Error) => void): HttpRequestHandler {
  return function httpRequestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const request = Request(req)

    runRequestHandlerStack(stack, request)
      .then(response => {
        if (response.skip) {
          // Some route handlers were run, but none of them felt responsible for this request
          response = Response.NotFound(request)
        }
        return applyResponseTo(response, res)
      })
      .catch(onUnhandledError)
  }
}

async function runRequestHandlerStack(stack: Middleware[], request: Request): Promise<Response> {
  let stackLayerIndex = 0
  const entryHandler = stack[0]

  const next = (refinedRequest: Request): Promise<Response> => {
    const nextHandler = stack[++stackLayerIndex]
    if (nextHandler) {
      return nextHandler(refinedRequest, next)
    } else {
      return Promise.resolve(Response.NotFound(request))
    }
  }
  return entryHandler(request, next)
}

function routeToMiddleware(route: Route) {
  return (request: Request) => Promise.resolve(route.handler(request))
}

export function Service(routing: Route | Route[], middlewares: Middleware[], options?: ServiceOptions): Service
export function Service(routing: Route | Route[], options?: ServiceOptions): Service

export function Service(
  routing: Route | Route[],
  second?: Middleware[] | ServiceOptions,
  third?: ServiceOptions
) {
  const customMiddlewares: Middleware[] = Array.isArray(second) ? second.map(assertMiddleware) : []
  const options: ServiceOptions = (Array.isArray(second) ? third : second) || {}
  const rootRouter: Route = Array.isArray(routing) ? Router(routing) : assertRoute(routing)

  const { gracefulCloseTimeout = Infinity } = options

  const middlewares = [...defaultMiddlewares, ...customMiddlewares]

  const defaultErrorHandler = (error: any) => {
    console.error("Internal service error:", error.stack || error)
    process.exit(1)
  }

  const service: Service = {
    middlewares,
    router: rootRouter,

    handler(onUnhandledError: (error: Error) => void = defaultErrorHandler) {
      const stack = [...middlewares, routeToMiddleware(rootRouter)]
      return createRequestHandler(stack, onUnhandledError)
    },
    listen(port?: number, host?: string) {
      const errorHandler = (error: any) => {
        console.error("Internal service error:", error)
        server.close(() => process.exit(1))
      }
      const handler = service.handler(errorHandler)
      const server = stoppable(http.createServer(handler), gracefulCloseTimeout)

      return new Promise(resolve => {
        server.listen(port, host, () => resolve(server))
      })
    }
  }
  return service
}
