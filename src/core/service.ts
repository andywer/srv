import * as http from "http"
import stoppable from "stoppable"
import { Request } from "./request"
import { applyResponseTo, Response } from "./response"
import { Route } from "./route"
import { Router } from "./router"
import { DefaultErrorMiddleware } from "../middlewares/error"
import { HttpRequestHandler, Middleware } from "../types"

export interface Service {
  readonly stack: Middleware[]

  handler(onUnhandledError?: (error: Error) => void): HttpRequestHandler
  listen(port?: number, host?: string): Promise<stoppable.StoppableServer>
}

export interface ServiceOptions {
  gracefulCloseTimeout?: number,
  skipDefaultMiddlewares?: boolean
}

const defaultMiddlewares: Middleware[] = [
  DefaultErrorMiddleware
]

function createRequestHandler(stack: Middleware[], onUnhandledError: (error: Error) => void): HttpRequestHandler {
  const rootRouter: Route = Router(stack)
  return function httpRequestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    const request = Request(req)

    ;(rootRouter(request) as Promise<Response>)
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

export function Service(
  entrypoint: Middleware | Route,
  options: ServiceOptions = {}
) {
  const {
    gracefulCloseTimeout = Infinity,
    skipDefaultMiddlewares = false
  } = options

  const stack: Middleware[] = [
    ...(skipDefaultMiddlewares ? [] : defaultMiddlewares),
    entrypoint
  ]

  const defaultErrorHandler = (error: any) => {
    console.error("Internal service error:", error.stack || error)
    process.exit(1)
  }

  const service: Service = {
    stack,

    handler(onUnhandledError: (error: Error) => void = defaultErrorHandler) {
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
