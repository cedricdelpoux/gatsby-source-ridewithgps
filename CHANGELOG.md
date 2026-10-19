# 0.1.0

## Features

- feat: add a `RideWithGpsRoute` node per route of the account, with
  `coordinates` in the same `[lng, lat]` shape as `gatsby-source-strava`
- feat: download only the routes changed since the last build, from the sync
  endpoint, and keep them in a `.ridewithgps` store out of the Gatsby cache
- feat: source the pinned routes with `routes.withPinned`
- feat: add your own fields to the routes with `routes.extend`
- feat: export `getRoutes`, to sync the routes outside Gatsby
- feat: export `verifyWebhookSignature` and `hasRouteChanges`, for a function
  rebuilding the site when a route changes
- feat: add a `gatsby-source-ridewithgps-token` command creating the
  authentication token

## Documentation

- docs: document the options, the store, the token, the queries and the webhook
