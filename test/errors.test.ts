import test from "ava"
import HttpError from "http-errors"
import request from "supertest"
import { Route, Service, Response } from "../src/index"

test("handles internal server errors", async t => {
  const route = Route.GET("(.*)", async () => {
    throw Error("Something went wrong")
  })
  const service = Service(route)

  const response = await request(service.handler())
    .get("/")
    .expect(500)

  t.is(response.text, "500 Internal Server Error")
})

test("handles explicit 500 errors", async t => {
  const route = Route.GET("(.*)", async () => {
    throw HttpError(500, "Something went wrong.")
  })
  const service = Service(route)

  const response = await request(service.handler())
    .get("/")
    .expect(500)

  t.is(response.text, "500 Internal Server Error")
})

test("handles 4xx errors", async t => {
  const route = Route.GET("(.*)", async () => {
    throw HttpError(401, "You are not allowed to see that.")
  })
  const service = Service(route)

  const response = await request(service.handler())
    .get("/")
    .expect(401)

  t.is(response.text, "You are not allowed to see that.")
})

test("route handler can throw response", async t => {
  const route = Route.GET("(.*)", async () => {
    throw Response.JSON(401, { failed: true })
  })
  const service = Service(route)

  const response = await request(service.handler())
    .get("/")
    .expect(401)

  t.deepEqual(response.body, { failed: true })
})
