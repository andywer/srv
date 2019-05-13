import { Request } from "./core/request"
import { Response } from "./core/response"
import { Route } from "./core/route"
import { Router } from "./core/router"
import { Middleware } from "./types"

type Func<Args extends any[], Result> = (...args: Args) => Result

export function composeMiddlewares<ReqIn extends Request, ReqOut extends Request, ResOut extends Response>(
  fn: Middleware<ReqIn, ReqOut, ResOut>
): (route: Route) => Route

export function composeMiddlewares<ReqIn extends Request, ReqOut extends Request, ResOut extends Response, Req1 extends Request>(
  fn1: Middleware<ReqIn, Req1>,
  fn2: Middleware<Req1, ReqOut, ResOut>
): (route: Route) => Route

export function composeMiddlewares<ReqIn extends Request, ReqOut extends Request, ResOut extends Response, Req1 extends Request, Req2 extends Request>(
  fn1: Middleware<ReqIn, Req1>,
  fn2: Middleware<Req1, Req2>,
  fn3: Middleware<Req2, ReqOut, ResOut>
): (route: Route) => Route

export function composeMiddlewares<ReqIn extends Request, ReqOut extends Request, ResOut extends Response, Req1 extends Request, Req2 extends Request, Req3 extends Request>(
  fn1: Middleware<ReqIn, Req1>,
  fn2: Middleware<Req1, Req2>,
  fn3: Middleware<Req2, Req3>,
  fn4: Middleware<Req3, ReqOut, ResOut>
): (route: Route) => Route

export function composeMiddlewares<ReqIn extends Request, ReqOut extends Request, ResOut extends Response, Req1 extends Request, Req2 extends Request, Req3 extends Request, Req4 extends Request>(
  fn1: Middleware<ReqIn, Req1>,
  fn2: Middleware<Req1, Req2>,
  fn3: Middleware<Req2, Req3>,
  fn4: Middleware<Req3, Req4>,
  fn5: Middleware<Req4, ReqOut, ResOut>
): (route: Route) => Route

export function composeMiddlewares<ReqIn extends Request, ReqOut extends Request, ResOut extends Response, Req1 extends Request, Req2 extends Request, Req3 extends Request, Req4 extends Request, Req5 extends Request>(
  fn1: Middleware<ReqIn, Req1>,
  fn2: Middleware<Req1, Req2>,
  fn3: Middleware<Req2, Req3>,
  fn4: Middleware<Req3, Req4>,
  fn5: Middleware<Req4, Req5>,
  fn6: Middleware<Req5, ReqOut, ResOut>
): (route: Route) => Route

export function composeMiddlewares<ReqIn extends Request, ReqOut extends Request, ResOut extends Response>(
  ...middlewares: Array<Func<any[], any>>
): (route: Route) => Route {
  if (middlewares.length === 0) {
    throw Error("No middlewares passed to compose.")
  }

  return function applyComposed(route: Route) {
    return Router([...middlewares, route])
  }
}
