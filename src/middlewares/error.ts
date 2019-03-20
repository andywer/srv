import statuses from "statuses"
import { Request } from "../core/request"
import { Response } from "../core/response"
import { Middleware, RequestHandler } from "../types"

export const DefaultErrorMiddleware: Middleware =
  async function DefaultErrorMiddleware(request: Request, next: RequestHandler): Promise<Response>
{
  try {
    return await next(request)
  } catch (error) {
    if (!error) {
      console.error(Error("Falsy value was thrown."))
      return Response.Text(500, "500 Internal Server Error")
    }

    if (typeof error === "object" && !(error instanceof Error) && typeof error.status === "number") {
      if (error.body || error.headers) {
        // Looks like a response
        return error as Response
      }
    }

    const defaultStatus = error.code === "ENOENT" ? 404 : 500
    const status = error.statusCode || error.status || defaultStatus

    if (status >= 500 && status <= 599) {
      console.error(error.stack || error)
    }

    return Response.Text(status, error.expose ? error.message : `${status} ${statuses[status]}`)
  }
}
