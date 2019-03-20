import * as http from "http"
import { Request } from "./core/request"
import { Response } from "./core/response"

export type HttpRequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void
export type Middleware = (request: Request, next: RequestHandler) => Promise<Response>
export type RequestHandler = (nextRequest: Request) => Promise<Response>
