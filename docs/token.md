# Token

The plugin authenticates with the basic authentication of the RideWithGPS API:
the API key of an API client, and an authentication token tied to your account.

## API key

1. Open the [API clients page](https://ridewithgps.com/api/api_clients) of your
   RideWithGPS account
2. Create an API client
3. Copy its API key

## Authentication token

Open a terminal at the root of your project and type:

```shell
gatsby-source-ridewithgps-token
```

The command asks for the API key, your RideWithGPS email and your password,
creates a token with `POST /api/v1/auth_tokens.json`, and writes both values
to your `.env` file:

```dotenv
RWGPS_API_KEY=your_api_key
RWGPS_AUTH_TOKEN=your_auth_token
```

Your password is only sent to RideWithGPS. It is never written anywhere.

Running the command again replaces the token in `.env`. You can also create a
token by hand with the "Create new Auth Token" button of your API client page.

## Expiration

The RideWithGPS documentation does not say whether a token expires. If a
build fails with `401 Failed to authenticate the request`, run the command
again to create a new one.

## Continuous integration

Add `RWGPS_API_KEY` and `RWGPS_AUTH_TOKEN` to the environment variables of
your continuous integration or hosting service. The token reads your private
routes, so keep it out of your repository.
