# Middlewares

## Using middlewares

```ts
import { Response, Route, Service } from "@andywer/srv"
import FancyMiddleware from "./middlewares/fancy"

const greet = Route.GET("/", async () => Response.Text("Hello world"))

const middlewares = [
  FancyMiddleware()
]
const service = Service([ greet ], middlewares)

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
