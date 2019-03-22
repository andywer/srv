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
  ANY(path: string, handler: RequestHandler): Route
  GET(path: string, handler: RequestHandler): Route
  DELETE(path: string, handler: RequestHandler): Route
  HEAD(path: string, handler: RequestHandler): Route
  LINK(path: string, handler: RequestHandler): Route
  OPTIONS(path: string, handler: RequestHandler): Route
  PATCH(path: string, handler: RequestHandler): Route
  POST(path: string, handler: RequestHandler): Route
  PUT(path: string, handler: RequestHandler): Route
  UNLINK(path: string, handler: RequestHandler): Route
}

const debug = DebugLogger("srv:route")

export function assertRoute(route: any): Route {
  if (route && typeof route === "object" && typeof route.handler === "function") {
    return route
  } else {
    throw Error(`Expected a route (or router), but got: ${route}`)
  }
}

function addParamsToRequest(request: Request, pathParamKeys: PathKey[], unnamedParams: string[]) {
  const params: { [name: string]: string } = {}

  for (let i = 0; i < pathParamKeys.length; i++) {
    params[pathParamKeys[i].name] = unnamedParams[i]
  }

  return request.derive({ params })
}

function VerbRouteHandler(method: string | "*") {
  return function (path: string, routeHandler: RequestHandler): Route {
    const matchAnyVerb = method === "*"

    const pathParamKeys: PathKey[] = []
    const pathRegex = pathToRegExp(path, pathParamKeys)

    debug(`Creating route handler... ${matchAnyVerb ? "" : method} ${path} (Regex: ${pathRegex})`)

    const handler = (request: Request) => {
      const methodMatch = matchAnyVerb || request.method === method
      const pathMatch = methodMatch ? pathRegex.exec(request.path) : null

      if (methodMatch && pathMatch) {
        if (pathMatch.length > 1) {
          const unnamedParams = pathMatch.slice(1)
          request = addParamsToRequest(request, pathParamKeys, unnamedParams)
        }

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

Route.ANY = VerbRouteHandler("*")
Route.GET = VerbRouteHandler("GET")
Route.DELETE = VerbRouteHandler("DELETE")
Route.HEAD = VerbRouteHandler("HEAD")
Route.LINK = VerbRouteHandler("LINK")
Route.OPTIONS = VerbRouteHandler("OPTIONS")
Route.PATCH = VerbRouteHandler("PATCH")
Route.POST = VerbRouteHandler("POST")
Route.PUT = VerbRouteHandler("PUT")
Route.UNLINK = VerbRouteHandler("UNLINK")
