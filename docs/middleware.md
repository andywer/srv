# Middlewares

## Using middlewares

Using middlewares is trivial as under the hood routes and routers are implemented as middleware-compatible functions, anyway. Just pass an array with all the middlewares and routes you want to apply to `Service()`.

Note: Order matters. First middlewares will be applied first, first routes will be checked first.

```ts
import { Response, Route, Service } from "@andywer/srv"
import FancyMiddleware from "./middlewares/fancy"

const greet = Route.GET("/", async () => Response.Text("Hello world"))

const middlewares = [
  FancyMiddleware()
]
const service = Service([ ...middlewares, greet ])

service.listen(8080)
  .catch(console.error)
```


## Writing middlewares

```ts
import {
  Request,
  RequestHandler,
  Response,
  Route,
  Service
} from "@andywer/srv"

function renderErrorPage(statusCode: number, message: string, link: string) {
  return `
    <!doctype html>
    <html lang="en">
    <head>
      <title>HTTP ${statusCode} - Error</title>
    </head>
    <body>
      <h1>HTTP ${statusCode} - Error</h1>
      <p>${message}</p>
      <p>See <a href="${link}">${link}</a>.</p>
    </body>
    </html>
  `.trim()
}

/**
 * Serve custom error page, containing a link to the HTTP error code's documentation.
 */
async function CustomErrorMiddleware(request: Request, next: RequestHandler) {
  try {
    // Run the next middleware or route handler in the pipeline for this request
    return await next(request)
  } catch (error) {
    const statusCode = error.statusCode || error.status || 500
    const message = (statusCode >= 400 && statusCode < 500)
      ? error.message
      : "Internal Server Error"

    const link = `https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/${statusCode}`
    const headers = {
      "Content-Type": "text/html; charset=utf8",
      "Link": `<${link}>; ref=docs`
    }

    const content = renderErrorPage(statusCode, message, link)
    return Response.Text(statusCode, headers, content)
  }
}

export default CustomErrorMiddleware
```

## Extending / Modifying the Request object

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
