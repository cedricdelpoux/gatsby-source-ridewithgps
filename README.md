<div align="center">
  <h1>gatsby-source-ridewithgps</h1>
  <br/>

[![Npm version][badge-npm]][npm]
[![Npm downloads][badge-npm-dl]][npm]
[![MIT license][badge-licence]](./LICENCE.md)
[![PRs welcome][badge-prs-welcome]](#contributing)

</div>

---

Gatsby plugin to use the routes of your RideWithGPS account as a data source

> Requires Node 20 or later.

## Usage

1. Download `gatsby-source-ridewithgps` from the NPM registry:

```shell
yarn add gatsby-source-ridewithgps
```

2. [Generate a token](./docs/token.md)

The package needs 2 `.env` variables:

```dotenv
RWGPS_API_KEY=your_api_key
RWGPS_AUTH_TOKEN=your_auth_token
```

Create an API client on the [RideWithGPS API clients page][rwgps-api-clients]
to get the API key, then open a terminal at the root of your project and type:

```shell
gatsby-source-ridewithgps-token
```

3. [Add the plugin](./docs/options.md) in your `gatsby-config.js` file

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

That's it!

## Data

The plugin creates one `RideWithGpsRoute` node per route of your account, with
a `coordinates` field holding the track as `[longitude, latitude]` pairs, the
same shape as `gatsby-source-strava`. The GraphQL type is declared by the
plugin, so your queries work even before the first route is fetched.

```graphql
query {
    allRideWithGpsRoute(sort: {created_at: DESC}) {
        nodes {
            id
            name
            distance
            elevation_gain
            private
            html_url
            created_at(formatString: "YYYY-MM-DD")
            coordinates
        }
    }
}
```

Read the [queries](./docs/queries.md) documentation for every field.

## Store

Your routes are downloaded once and kept in a `.ridewithgps` directory next to
your `gatsby-config.js`, not in the Gatsby cache. A build only downloads the
routes created or updated since the previous one, and drops the deleted ones,
even after a `gatsby clean` or on a fresh continuous integration checkout.

## Commands

| Command                           | What it does                                     |
| --------------------------------- | ------------------------------------------------ |
| `gatsby-source-ridewithgps-token` | Creates the authentication token the plugin uses |

## Documentation

- [Options](./docs/options.md), everything you can configure
- [Token](./docs/token.md), creating the authentication token
- [Store](./docs/store.md), where your routes live and when they are fetched
- [Queries](./docs/queries.md), the fields of a route node
- [Webhook](./docs/webhook.md), rebuilding your site when a route changes

## Contributing

- ⇄ Pull/Merge requests and ★ Stars are always welcome.
- For bugs and feature requests, please [create an issue][github-issue].

## Changelog

See [CHANGELOG](./CHANGELOG.md)

## License

This project is licensed under the MIT License - see the
[LICENCE](./LICENCE.md) file for details

[badge-npm]: https://img.shields.io/npm/v/gatsby-source-ridewithgps.svg?style=flat-square
[badge-npm-dl]: https://img.shields.io/npm/dt/gatsby-source-ridewithgps.svg?style=flat-square
[badge-licence]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[badge-prs-welcome]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[npm]: https://www.npmjs.org/package/gatsby-source-ridewithgps
[github-issue]: https://github.com/cedricdelpoux/gatsby-source-ridewithgps/issues/new
[rwgps-api-clients]: https://ridewithgps.com/api/api_clients
