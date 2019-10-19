/*
 * Keep in mind that the router is a very performance-sensitive piece of software.
 * That is also why all `debug()` calls have been wrapped in an explicit
 * `if (debug.enabled)` here: Too skip the message creation if it's not gonna be logged.
 */

import DebugLogger from "debug"
import { Middleware } from "../types"
import { Request } from "./request"
import { Response } from "./response"
import { assertRoute, isRoute, Route } from "./route"
import { $route } from "./symbols"

const debug = DebugLogger("srv:router")
let nextRouterID = 1

function assertHandler(thing: any): Middleware {
  if (thing && typeof thing === "function") {
    return thing
  } else {
    throw Error(`Expected a route or middleware function, but got: ${thing}`)
  }
}

async function runRequestHandlerStack(stack: Middleware[], request: Request): Promise<Response> {
  let stackLayerIndex = 0
  const entryHandler = stack[0]

  const next = async (refinedRequest: Request): Promise<Response> => {
    const nextHandler = stack[++stackLayerIndex]
    if (nextHandler) {
      return nextHandler(refinedRequest, next)
    } else {
      return Response.Skip()
    }
  }
  return entryHandler(request, next)
}

function routeToMiddleware(route: Route): Middleware {
  assertRoute(route)
  return async (request, next): Promise<Response> => {
    if (route[$route].method && route[$route].method !== request.method) {
      if (debug.enabled) {
        debug(`Skipping route ${route}. Reason: HTTP method does not match.`)
      }
      return next(request)
    }

    const response = await route(request)
    if (response.skip) {
      if (debug.enabled) {
        debug(`Route handler ${route} returned Route.Skip()`)
      }
      return next(request)
    } else {
      if (debug.enabled) {
        debug(`Route handler ${route} returned response. Done.`)
      }
      return response
    }
  }
}

export interface Router {
  <Req extends Request, Res extends Response>(
    handlers: []
  ): Route<Req, Res>
  <Req extends Request, Res extends Response>(
    handlers: [
      Route<Req, Res>
    ]
  ): Route<Req, Res>
  <Req extends Request, Res extends Response, Req1 extends Request>(
    handlers: [
      Middleware<Req, Req1, Res>,
      ...Array<Route<Req1, Res>>
    ]
  ): Route<Req, Res>
  <Req extends Request, Res extends Response, Req1 extends Request, Req2 extends Request>(
    handlers: [
      Middleware<Req, Req1, Res>,
      Middleware<Req1, Req2, Res>,
      ...Array<Route<Req2, Res>>
    ]
  ): Route<Req, Res>
  <Req extends Request, Res extends Response, Req1 extends Request, Req2 extends Request, Req3 extends Request>(
    handlers: [
      Middleware<Req, Req1, Res>,
      Middleware<Req1, Req2, Res>,
      Middleware<Req2, Req3, Res>,
      ...Array<Route<Req3, Res>>
    ]
  ): Route<Req, Res>
  <Req extends Request, Res extends Response, Req1 extends Request, Req2 extends Request, Req3 extends Request, Req4 extends Request>(
    handlers: [
      Middleware<Req, Req1, Res>,
      Middleware<Req1, Req2, Res>,
      Middleware<Req2, Req3, Res>,
      Middleware<Req3, Req4, Res>,
      ...Array<Route<Req4, Res>>
    ]
  ): Route<Req, Res>
  <Req extends Request = Request, Res extends Response = Response>(
    handlers: Array<Middleware | Route>
  ): Route<Req, Res>
}

export const Router: Router = function Router(handlers: Array<Middleware | Route>): Route {
  const routerID = nextRouterID++

  debug(`Creating router #${routerID}...`)
  debug(`  Handlers: ${handlers.map(handler => String(handler)).join(", ")}`)

  const stack = handlers.map(handler => {
    return isRoute(handler) ? routeToMiddleware(handler) : assertHandler(handler)
  })

  const handler = (request: Request) => {
    if (debug.enabled) {
      debug(`Running ${router} for request... ${request.method} ${request.url}`)
    }
    return runRequestHandlerStack(stack, request)
  }

  const router: Route = Object.assign(handler, {
    [Symbol.toPrimitive](hint: string) {
      return hint === "string" ? `[Router #${routerID}]` : null
    },
    [$route]: {}
  })
  return router
}

