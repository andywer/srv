import test from "ava"
import request from "supertest"
import { Response, Route, Service } from "../src/index"

test("can spawn server and serve a route", async t => {
  let routeHandlerWasCalled = false

  const route = Route.GET("(.*)", async req => {
    routeHandlerWasCalled = true
    t.is(req.method, "GET")
    t.is(req.path, "/")
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
  const route = Route.GET("(.*)", () => Response.Text("Hello World"))
  const server = await Service(route).listen(3123)

  try {
    await request("http://localhost:3123").get("/").expect(200)
  } finally {
    await server.close()
  }
  t.pass()
})

test("can redirect", async t => {
  const service = Service([
    Route.GET("(.*)", () => Response.Redirect("https://github.com/andywer"))
  ])

  await request(service.handler())
    .get("/")
    .expect(302)
    .expect("Location", "https://github.com/andywer")

  t.pass()
})

test("requesting an unhandled URL results in a 404 error", async t => {
  const service = Service([
    Route.GET("/", () => Response.Text(""))
  ])

  await request(service.handler())
    .get("/wtf")
    .expect(404)

  t.pass()
})

test("can parse query parameters", async t => {
  const service = Service([
    Route.GET("/", (request) => Response.JSON(request.query))
  ])

  const response = await request(service.handler())
    .get("/")
    .query("name=Andy&where=developer&where=crazy")
    .expect(200)

  t.deepEqual(response.body, {
    name: "Andy",
    where: ["developer", "crazy"]
  })
})

test("can parse path parameters", async t => {
  const service = Service([
    Route.GET("/:primary/test/:secondary/(.+)", (request) => Response.JSON(request.params))
  ])

  const response = await request(service.handler())
    .get("/foo/test/bar/add/2")
    .expect(200)

  t.deepEqual(response.body, {
    "0": "add/2",
    primary: "foo",
    secondary: "bar"
  })
})
