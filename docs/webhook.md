# Webhook

RideWithGPS can call a url of yours whenever a route is created, updated,
deleted, pinned or unpinned. Pointed at a function that triggers a build of
your site, it keeps your site in step with your RideWithGPS account.

The plugin does not ship that function, since it depends on your host. It
exports the two helpers it needs:

- `verifyWebhookSignature({rawBody, signature, clientSecret})` checks that the
  request comes from RideWithGPS. It computes the HMAC-SHA256 of the raw body
  with the secret of your API client, and compares it in constant time to the
  `x-rwgps-signature` header.
- `hasRouteChanges(notifications)` tells whether at least one notification is
  about a route, trips being ignored.

## Configuration

On the [API clients page](https://ridewithgps.com/api/api_clients), edit your
API client:

1. Enter the url of your function as the webhook url
2. Check the `route` asset type
3. Copy the client secret, used to check the signature

## Two constraints from RideWithGPS

- **It expects a `200` within 1 second.** A build hook can take longer than
  that, so the function answers first and triggers the build afterwards.
- **It never sends a webhook again.** A call that failed, or arrived while
  your function was down, is lost. This is harmless: the build does not use
  the content of the webhook, it runs the [incremental sync](./store.md), which
  catches up on every change since the previous build, the missed ones
  included.

## Netlify function

Create a [build hook](https://docs.netlify.com/configure-builds/build-hooks/)
in the settings of your Netlify site, then add `RWGPS_CLIENT_SECRET` and
`NETLIFY_BUILD_HOOK_URL` to its environment variables.

`netlify/functions/ridewithgps-webhook.mjs`:

```js
import {
    hasRouteChanges,
    verifyWebhookSignature,
} from "gatsby-source-ridewithgps"

export default async (request, context) => {
    if (request.method !== "POST") {
        return new Response("Method not allowed", {status: 405})
    }

    // The signature is computed on the body as it was sent, so it must be
    // read as text, before any JSON parsing
    const rawBody = await request.text()

    const isFromRideWithGps = verifyWebhookSignature({
        rawBody,
        signature: request.headers.get("x-rwgps-signature"),
        clientSecret: Netlify.env.get("RWGPS_CLIENT_SECRET"),
    })

    if (!isFromRideWithGps) {
        return new Response("Invalid signature", {status: 401})
    }

    const {notifications} = JSON.parse(rawBody)

    if (hasRouteChanges(notifications)) {
        // Runs after the response is sent, so that RideWithGPS gets its
        // 200 within the second it allows
        context.waitUntil(
            fetch(Netlify.env.get("NETLIFY_BUILD_HOOK_URL"), {method: "POST"})
        )
    }

    return new Response("OK")
}

export const config = {
    path: "/webhooks/ridewithgps",
}
```

The webhook url to enter on RideWithGPS is then
`https://<your-site>.netlify.app/webhooks/ridewithgps`.

Netlify queues the builds a hook triggers, so editing several routes in a row
does not start as many builds at once.

## Before relying on it

- RideWithGPS documents webhooks for the users of an API client, and its own
  example describes OAuth. Whether it calls a webhook for the changes of the
  account that owns the API client, authenticated with basic authentication
  as this plugin is, is not stated. Edit a route once the function is
  deployed, and check its logs on Netlify.
- The client secret is shown once the API client is set up for OAuth, with at
  least one redirect URI. If your API client page shows no secret, add a
  redirect URI, any url you own, to get one.
