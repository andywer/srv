# Routing

## Setting up routes

```ts
import { Response, Route, Service } from "@andywer/srv"

const greet = Route.GET("/welcome", async () => {
  return Response.Text("Hello world")
})
const greetPersonally = Route.GET("/welcome/:name", async request => {
  return Response.Text(`Hello, ${request.params.name}`)
})

const service = Service([ greet, greetPersonally ])

service.listen(8080)
  .catch(console.error)
```


## Route parameters

SRV uses [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp) to match requested paths and parse the path parameters, the same way that Express and Koa do.

```ts
import { Response, Route } from "@andywer/srv"

export const greet = Route.GET("/welcome/:name", async request => {
  return Response.Text(`Hello, ${request.params.name}`)
})
export const greet2 = Route.GET("/welcome/([A-Za-z]+)", async request => {
  return Response.Text(`Hello, ${request.params.0}`)
})
```

## Group routes using Router()

By using `Router()` you can group multiple routes. The result of `Router()` is also just a route object, so you can compose routes and routers any way you like.

```ts
import { Response, Route, Router } from "@andywer/srv"

const index = Route.GET("/", async () => {
  return Response.JSON({ name: "My service", status: "running" })
})

const greetings = Router([
  Route.GET("/welcome/:name", async request => {
    return Response.Text(`Hello, ${request.params.name}`)
  }),
  Route.GET("/welcome/([A-Za-z]+)", async request => {
    return Response.Text(`Hello, ${request.params.0}`)
  })
])

export default Router([
  index,
  greetings
])
```
