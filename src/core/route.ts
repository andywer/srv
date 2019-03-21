import DebugLogger from "debug"
import pathToRegExp, { Key as PathKey } from "path-to-regexp"
import { Request } from "./request"
import { Response } from "./response"

export type RequestHandler<Req extends Request = Request, Res extends Response = Response> = (request: Req) => Res | Promise<Res>

export interface Route<Req extends Request = Request, Res extends Response = Response> {
  [Symbol.toStringTag]: string
  handler: RequestHandler<Req, Res>
  method?: string
  pathTemplate?: string
}

interface RouteCreators {
  any(path: string, handler: RequestHandler): Route
  get(path: string, handler: RequestHandler): Route
  delete(path: string, handler: RequestHandler): Route
  head(path: string, handler: RequestHandler): Route
  link(path: string, handler: RequestHandler): Route
  options(path: string, handler: RequestHandler): Route
  patch(path: string, handler: RequestHandler): Route
  post(path: string, handler: RequestHandler): Route
  put(path: string, handler: RequestHandler): Route
  unlink(path: string, handler: RequestHandler): Route
}

const debug = DebugLogger("srv:route")

export function assertRoute(route: any): Route {
  if (route && typeof route === "object" && typeof route.handler === "function") {
    return route
  } else {
    throw Error(`Expected a route (or router), but got: ${route}`)
  }
}

function VerbRouteHandler(method: string | "*") {
  return function (path: string, routeHandler: RequestHandler): Route {
    const matchAnyVerb = method === "*"

    const pathParamKeys: PathKey[] = []
    const pathRegex = pathToRegExp(path, pathParamKeys)

    debug(`Creating route handler... ${matchAnyVerb ? "" : method} ${path} (Regex: ${pathRegex})`)

    const handler = (request: Request) => {
      if ((matchAnyVerb || request.method === method) && pathRegex.test(request.path())) {
        debug(`Match: Route handler [${matchAnyVerb ? "" : method} ${path}] matches ${request.method} ${request.url}`)
        // TODO: Use Object.create() to create derived request object containing path params
        return routeHandler(request)
      } else {
        debug(`Skip: Route handler [${matchAnyVerb ? "" : method} ${path}] does not match ${request.method} ${request.url}`)
        return Response.Skip()
      }
    }
    return Route(handler, {
      method: method && method !== "*" ? method : undefined,
      pathTemplate: path
    })
  }
}

interface RouteOptions {
  method?: string
  pathTemplate?: string
}

export const Route = function Route(handler: RequestHandler, options: RouteOptions = {}): Route {
  return {
    get [Symbol.toStringTag]() {
      return options.pathTemplate
        ? `[Route ${options.method || "*"} ${options.pathTemplate}]`
        : `[Route]`
    },
    handler,
    method: options.method,
    pathTemplate: options.pathTemplate
  }
} as ((handler: RequestHandler, options?: RouteOptions) => Route) & RouteCreators

Route.any = VerbRouteHandler("*")
Route.get = VerbRouteHandler("GET")
Route.delete = VerbRouteHandler("DELETE")
Route.head = VerbRouteHandler("HEAD")
Route.link = VerbRouteHandler("LINK")
Route.options = VerbRouteHandler("OPTIONS")
Route.patch = VerbRouteHandler("PATCH")
Route.post = VerbRouteHandler("POST")
Route.put = VerbRouteHandler("PUT")
Route.unlink = VerbRouteHandler("UNLINK")
