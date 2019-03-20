import test from "ava"
import request from "supertest"
import { Response, Route, Service } from "../src/index"

test("can spawn server and serve a route", async t => {
  let routeHandlerWasCalled = false

  const route = Route.get("(.*)", async req => {
    routeHandlerWasCalled = true
    t.is(req.method, "GET")
    t.is(req.path(), "/")
    return Response.Text("Hello World")
  })
  const service = Service(route)

  const response = await request(service.handler())
    .get("/")
    .expect(200)

  t.is(response.text, "Hello World")
  t.is(response.status, 200)
  t.is(routeHandlerWasCalled, true)
})
