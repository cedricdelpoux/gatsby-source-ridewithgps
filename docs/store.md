# Store

`gatsby-source-ridewithgps` keeps your routes on disk and only downloads what
changed on the next builds.

```
.ridewithgps/
├── routes/
│   ├── 101.json
│   └── 201.json
└── state.json
```

One file per route, named after its id and holding the route as RideWithGPS
returns it, track points included. `state.json` holds the date of the last
sync.

The directory sits next to your `gatsby-config.js` and is yours: nothing but
you empties it. Add it to your `.gitignore`, or commit it to give your
continuous integration your routes without downloading them.

Use the `storeDir` option to put it somewhere else:

```js
module.exports = {
    plugins: [
        {
            resolve: "gatsby-source-ridewithgps",
            options: {
                storeDir: ".ridewithgps",
            },
        },
    ],
}
```

## Why not the Gatsby cache

Gatsby empties its cache whenever the version of any installed plugin changes,
`package.json` is touched, `gatsby-config.js` or `gatsby-node.js` is edited, or
`gatsby clean` is run. A continuous integration job usually starts without a
`.cache` directory at all, and would download every route on every build.

## Incremental sync

Every build calls the RideWithGPS sync endpoint,
`GET /api/v1/sync.json?since=...&assets=routes`, which lists what happened to
your routes since a date:

- The first build asks for everything since `1970-01-01`.
- Each route `created` or `updated` is downloaded again with
  `GET /api/v1/routes/{id}.json` and written to the store.
- Each route `deleted` is removed from the store.
- The routes `added` to or `removed` from your pinned routes are ignored,
  unless the [`routes.withPinned`](./options.md#routeswithpinned) option is on.
- The date RideWithGPS returns, `meta.rwgps_datetime`, is written to
  `state.json` for the next build.

The date is only written once every change is in the store. A build stopped
halfway downloads the same routes again on the next one, and misses nothing.

A route that can no longer be read, deleted or made inaccessible between the
sync and its download, is removed from the store.

## When RideWithGPS cannot be reached

On a network error or a server error, the plugin prints a warning and builds
your site from the routes already in the store.

## Starting over

Delete the directory. The next build downloads every route again.

## Outside Gatsby

`getRoutes` runs the same sync and returns the normalized routes, the way the
nodes hold them. A serverless function has to keep its store in a writable
directory:

```js
const {getRoutes} = require("gatsby-source-ridewithgps")

const routes = await getRoutes({
    apiKey: process.env.RWGPS_API_KEY,
    authToken: process.env.RWGPS_AUTH_TOKEN,
    storeDir: "/tmp/.ridewithgps",
    withPinned: false,
})
```

A store under `/tmp` does not outlive the function instance, so a cold start
downloads every route again.
