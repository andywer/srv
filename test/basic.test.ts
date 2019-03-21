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
  t.is(routeHandlerWasCalled, true)
})

test("service.listen() works", async t => {
  const route = Route.get("(.*)", () => Response.Text("Hello World"))
  const server = await Service(route).listen(3000)

  try {
    await request("http://localhost:3000").get("/").expect(200)
  } finally {
    await server.close()
  }
  t.pass()
})

test("can redirect", async t => {
  const service = Service([
    Route.get("(.*)", () => Response.Redirect("https://github.com/andywer"))
  ])

  await request(service.handler())
    .get("/")
    .expect(302)
    .expect("Location", "https://github.com/andywer")

  t.pass()
})

test.todo("requesting an unhandled URL results in a 404 error")
test.todo("can parse query parameters")
test.todo("can parse path parameters")
