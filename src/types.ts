import * as http from "http"
import { Request } from "./core/request"
import { Response } from "./core/response"

export type HttpRequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void

export type Middleware<
  ReqIn extends Request = Request,
  ReqOut extends Request = Request,
  Res extends Response = Response
> = (request: ReqIn, next: RequestHandler<ReqOut, Res>) => Promise<Res> | Res

export type RequestHandler<
  Req extends Request = Request,
  Res extends Response = Response
> = (nextRequest: Req) => Promise<Res> | Res
