import test from "ava"
import request from "supertest"
import { composeMiddlewares, Middleware, Request, Response, Route, Router, Service } from "../src/index"

test("can assign new props to a request", async t => {
  interface CustomRequest extends Request {
    foo: string
  }

  const fooMiddleware: Middleware<Request, CustomRequest> = async (request, next) => {
    const derivedReq = request.derive({
      foo: "bar"
    })
    return next(derivedReq)
  }

  const router = Router([
    fooMiddleware,

    Route.GET("/test", (request: CustomRequest) => {
      return Response.Text(200, request.foo)
    })
  ])
  const service = Service(router)

  const response = await request(service.handler())
    .get("/")
    .expect(200)

  t.is(response.text, "foo")
})
