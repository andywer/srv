# SRV

Node.js server frameworks rethought. Functional, lean, performant.

* Built for modern JavaScript / TypeScript
* Functional - Take a request, return a response
* Explicit - No context objects
* Immutable, but extendable data makes debugging easy
* Few dependencies & less than 1000 lines of code

**Status: Experimental**

## In a nut shell

```ts
import {
  Response,
  Route,
  Router,
  Service
} from "@andywer/srv"

const greet = Route.GET("/", async request => {
  return Response.JSON({
    name: "Greeting service",
    welcome: request.query.name ? `Hello, ${request.query.name}!` : `Hi there!`
  })
})

const service = Service(Router([ greet ]))

service.listen(8080)
  .catch(console.error)
```

## Documentation

<!-- Basics -->
* [Routing](./docs/routing.md)
* [Middleware](./docs/middleware.md)

## Debugging

Set the `DEBUG` environment variable to `srv:*` to get some debug logging:

```
$ DEBUG=srv:* node ./dist/my-server
```

## License

MIT
