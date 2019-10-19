import DebugLogger from "debug"
import pathToRegExp, { Key as PathKey } from "path-to-regexp"
import { Request } from "./request"
import { Response } from "./response"
import { $route } from "./symbols"

export type RequestHandler<Req extends Request = Request, Res extends Response = Response> = (request: Req) => Res | Promise<Res>

export interface Route<Req extends Request = Request, Res extends Response = Response> extends RequestHandler<Req, Res> {
  [Symbol.toPrimitive]: (hint: string) => string | null
  [$route]: {
    method?: string
    pathTemplate?: string
  }
}

export interface RouteCreators {
  ANY<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
  GET<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
  DELETE<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
  HEAD<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
  LINK<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
  OPTIONS<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
  PATCH<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
  POST<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
  PUT<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
  UNLINK<Req extends Request = Request, Res extends Response = Response>(
    path: string,
    handler: RequestHandler<Req, Res>
  ): Route<Req, Res>
}

const debug = DebugLogger("srv:route")

export const isRoute = (thing: any): thing is Route => thing && typeof thing === "function" && thing[$route]

export function assertRoute(route: any): Route {
  if (isRoute(route)) {
    return route
  } else {
    throw Error(`Expected a route (or router), but got: ${route}`)
  }
}

function addParamsToRequest<Req extends Request>(
  request: Req,
  pathParamKeys: PathKey[],
  unnamedParams: string[]
): Req {
  const params: { [name: string]: string } = {}

  for (let i = 0; i < pathParamKeys.length; i++) {
    params[pathParamKeys[i].name] = unnamedParams[i]
  }

  return request.derive({ params }) as Req
}

function VerbRouteHandler<Req extends Request, Res extends Response>(method: string | "*") {
  return function (path: string, routeHandler: RequestHandler<Req, Res>): Route<Req, Res> {
    const matchAnyVerb = method === "*"

    const pathParamKeys: PathKey[] = []
    const pathRegex = pathToRegExp(path, pathParamKeys)

    debug(`Creating route handler... ${matchAnyVerb ? "" : method} ${path} (Regex: ${pathRegex})`)

    const handler = (request: Req): Res | Promise<Res> => {
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
        return Response.Skip() as Res
      }
    }
    return Route<Req, Res>(handler, {
      method: method && method !== "*" ? method : undefined,
      pathTemplate: path
    })
  }
}

interface RouteOptions {
  method?: string
  pathTemplate?: string
}

export interface RouteFactory extends RouteCreators {
  <Req extends Request, Res extends Response>(handler: RequestHandler<Req, Res>, options?: RouteOptions): Route<Req, Res>
}

export const Route: RouteFactory = function Route<Req extends Request, Res extends Response>(
  handler: RequestHandler<Req, Res>,
  options: RouteOptions = {}
): Route<Req, Res> {
  return Object.assign(handler, {
    [Symbol.toPrimitive](hint: string) {
      if (hint === "string") {
        return options.pathTemplate
          ? `[Route ${options.method || "*"} ${options.pathTemplate}]`
          : `[Route]`
      }
      return null
    },
    [$route]: {
      method: options.method,
      pathTemplate: options.pathTemplate
    }
  })
}

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
