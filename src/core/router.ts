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
      debug(`Skipping route ${route}. Reason: HTTP method does not match.`)
      return next(request)
    }

    const response = await route(request)
    if (response.skip) {
      debug(`Route handler ${route} returned Route.Skip()`)
      return next(request)
    } else {
      debug(`Route handler ${route} returned response. Done.`)
      return response
    }
  }
}

export function Router(handlers: Array<Middleware | Route>): Route {
  const routerID = nextRouterID++

  debug(`Creating router #${routerID}...`)
  debug(`  Handlers: ${handlers.map(handler => String(handler)).join(", ")}`)

  const stack = handlers.map(handler => {
    return isRoute(handler) ? routeToMiddleware(handler) : assertHandler(handler)
  })

  const handler = (request: Request) => {
    debug(`Running ${router} for request... ${request.method} ${request.url}`)
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

