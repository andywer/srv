# SRV

Node.js server frameworks rethought. Functional, lean, performant.

* Built for modern JavaScript / TypeScript
* Functional - Take a request, return a response
* Explicit - No context objects
* Immutable, but extendable data makes debugging easy
* Few dependencies & less than 1000 lines of code

<p align="center">
  <b>Status: Experimental ⚠️</b>
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

## Motivation

What if we were to write [express](https://github.com/expressjs/express) from scratch in 2019...

Would we use async functions and promises? - Definitely.<br />
Would we make it more functional? - I think so.<br />
With TypeScript in mind? - Of course.<br />

Well, here we go!

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
  <summary><b>Functional</b></summary>

Take a request, return a response. Lean, clean, easy to test and debug.

```ts
import { Response, Route } from "@andywer/srv"
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
```
</details>

<details>
  <summary><b>No mutations</b></summary>

Stop passing data from middlewares to route handlers by dumping it in an untypeable `context`. Take the request object, extend it, pass it down to the route handler.

```ts
import { Middleware, Request, RequestHandler } from "@andywer/srv"
import { Logger } from "./logger"

function LoggingMiddleware(logger: Logger): Middleware {
  return async (request: Request, next: RequestHandler) => {
    const requestWithLogger = request.derive({
      log: logger
    })
    // typeof requestWithLogger.log === Logger
    return next(requestWithLogger)
  }
}
```
</details>

<details>
  <summary><b>Statically typed</b></summary>

TypeScript all the way! You don't need to use TypeScript to use SRV, though, of course.

It will work just as well with good old JavaScript.
</details>

## Debugging

Set the `DEBUG` environment variable to `srv:*` to get some debug logging:

```
$ DEBUG=srv:* node ./dist/my-server
```

## License

MIT
