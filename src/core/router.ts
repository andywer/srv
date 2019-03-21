import DebugLogger from "debug"
import { Request } from "./request"
import { Response } from "./response"
import { assertRoute, Route } from "./route"

const debug = DebugLogger("srv:router")
let nextRouterID = 1

export function Router(routes: Route[]): Route {
  const routerID = nextRouterID++

  debug(`Creating router #${routerID}...`)
  debug(`  Routes: ${routes.map(route => String(route)).join(", ")}`)

  routes.forEach(assertRoute)

  const router: Route = {
    get [Symbol.toStringTag] () {
      return `[Router #${routerID}]`
    },
    async handler(request: Request) {
      debug(`Running ${router} for request... ${request.method} ${request.url}`)
      for (const route of routes) {
        if (route.method && route.method !== request.method) {
          debug(`${router}: Skipping route ${route}. Reason: HTTP method does not match.`)
          continue
        }

        const response = await route.handler(request)
        if (response.skip) {
          debug(`${router}: Route handler ${route} returned Route.Skip()`)
          continue
        } else {
          debug(`${router}: Route handler ${route} returned response. Done.`)
          return response
        }
      }
      return Response.Skip()
    }
  }
  return router
}

