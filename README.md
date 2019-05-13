<h1 align="center">SRV</h1>

<p align="center">
  <b>Node.js servers rethought: Functional, lean, performant.</b>
</p>

<p align="center">
  <a href="https://travis-ci.org/andywer/srv"><img alt="Travis build status" src="https://img.shields.io/travis/andywer/srv.svg?logo=travis&style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/@andywer/srv"><img alt="Travis build status" src="https://img.shields.io/npm/v/andywer/srv.svg?logo=npm&style=flat-square" /></a>
</p>

<br />

What if we were to write [express](https://github.com/expressjs/express) from scratch in 2019...

Would we use async functions and promises? Would we make it more functional? With TypeScript in mind?

Sure we would! So here we go.

* Built for modern JavaScript / TypeScript
* Functional - Take a request, return a response
* Explicit - Clear static types
* Few dependencies & less than 1000 lines of code

<p align="center">
  <b>⚠️ Status: Experimental ⚠️</b>
</p>

## At a glance

```ts
import {
  Response,
  Route,
  Router,
  Service
} from "@andywer/srv"

const greet = Route.GET("/welcome", async (request) => {
  const name = request.query.name

  return Response.JSON({
    name: "Greeting service",
    welcome: name ? `Hello, ${name}!` : `Hi there!`
  })
})

const service = Service(Router([ greet ]))

service.listen(8080)
  .catch(console.error)
```

## Documentation

Find some documentation and sample code here. Work in progress right now.

<!-- Basics -->
* [Routing](./docs/routing.md)
* [Middleware](./docs/middleware.md)

## Features

<details>
  <summary><b>Async functions</b></summary>

No callbacks. Leverage modern day features instead for an optimal developer experience.

```ts
import { Response, Route } from "@andywer/srv"

const greet = Route.GET("/health", async () => {
  try {
    const stats = await fetchHealthMetrics()
    return Response.JSON({
      operational: true,
      stats
    })
  } catch (error) {
    return Response.JSON(500, {
      operational: false
    })
  }
})
```
</details>

<details>
  <summary><b>Functional route handlers</b></summary>

Take a request, return a response. Lean, clean, easy to test and debug.

```ts
import { Response, Route, Router } from "@andywer/srv"
import { queryUserByID } from "./database/users"

const getUser = Route.GET("/user/:id", async request => {
  const userID = request.params.id
  const user = await queryUserByID(userID)

  if (!user) {
    return Response.JSON(404, {
      message: `User ${userID} not found`
    })
  }

  const headers = {
    "Last-Modified": user.updated_at || user.created_at
  }
  return Response.JSON(200, headers, user)
})

export const router = Router([
  getUser
])
```
</details>

<details>
  <summary><b>No mutations</b></summary>

Stop passing data from middlewares to route handlers by dumping it in an untypeable `context`. Take the request object, extend it, pass it down to the route handler.

By applying middlewares in a direct and explicit manner, the passed requests and responses are completely type-safe, even if customized by middlewares.

```ts
import { Middleware, Request, RequestHandler, Service } from "@andywer/srv"
import { Logger } from "./logger"

export default function LoggingMiddleware(logger: Logger): Middleware {
  return async (request: Request, next: RequestHandler) => {
    const requestWithLogger = request.derive({
      log: logger
    })
    // typeof requestWithLogger.log === Logger
    return next(requestWithLogger)
  }
}
```

```ts
import { composeMiddlewares, Service } from "@andywer/srv"
import logger from "./logger"
import router from "./routes"

const applyMiddlewares = composeMiddlewares(
  LoggingMiddleware(logger),
  SomeOtherMiddleware()
)

const service = Service(applyMiddlewares(router))
```
</details>

<details>
  <summary><b>Everything is a function</b></summary>

The code base is relatively simple. Middlewares, routes and routers, they are all just implementations of the following function type:

```ts
type RequestHandler = (request: Request, next?: NextCallback) => Response | Promise<Response>
```

```ts
type NextCallback = (req: Request) => Response | Promise<Response>
```
</details>

## Debugging

Set the `DEBUG` environment variable to `srv:*` to get some debug logging:

```
$ DEBUG=srv:* node ./dist/my-server
```

## License

MIT
