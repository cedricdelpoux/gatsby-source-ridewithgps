# Options

## Mandatory options

```js
require("dotenv").config()

module.exports = {
    plugins: [
        {
            resolve: "gatsby-source-ridewithgps",
            options: {
                apiKey: process.env.RWGPS_API_KEY,
                authToken: process.env.RWGPS_AUTH_TOKEN,
            },
        },
    ],
}
```

When one of them is missing, the plugin prints a warning and creates no node,
so that a site still builds without RideWithGPS credentials. Read the
[Token](./token.md) documentation to get them.

## Every option

```js
module.exports = {
    plugins: [
        {
            resolve: "gatsby-source-ridewithgps",
            options: {
                apiKey: process.env.RWGPS_API_KEY,
                authToken: process.env.RWGPS_AUTH_TOKEN,
                // Directory of the store, relative to the site's root
                storeDir: ".ridewithgps",
                // Print the stack trace of an error that stops the build
                debug: false,
                routes: {
                    // Also source the routes pinned in your RideWithGPS
                    // library, those of other users included
                    withPinned: false,
                    // Add your own fields to every route
                    extend: ({route}) => {
                        route.isGravel =
                            route.activity_types.includes("cycling:gravel")
                    },
                },
            },
        },
    ],
}
```

### `storeDir`

Read the [Store](./store.md) documentation.

### `routes.withPinned`

Without it, the plugin only sources the routes you created. With it, it also
sources the routes you pinned, and drops a route of another user once you
unpin it. Unpinning one of your own routes keeps it.

RideWithGPS only reports what you do, so a pinned route of another user is
never fetched again after you pinned it, even when its owner edits it.

Changing this option downloads every route again on the next build.

### `routes.extend`

Called on every route before its node is created, with the route already
normalized: `id` is a string, `private` and `coordinates` are set, and
`track_points` is gone. Whatever you add to `route` ends up on the node.

## Rate limits

RideWithGPS documents no rate limit. Should it answer `429 Too Many Requests`,
the plugin waits and tries again, up to 4 times over about 2 minutes, then
fails the build. The next build resumes from where the previous one stopped.
