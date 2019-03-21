# SRV

Node.js server rethought. Functional, lean, performant.

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

## License

MIT
