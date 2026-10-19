const RIDEWITHGPS_URL = "https://ridewithgps.com"

// RideWithGPS documents neither a rate limit nor `Retry-After`, hence these
// delays when a 429 names no wait of its own
const RATE_LIMIT_RETRY_DELAYS_MS = [5000, 15000, 30000, 60000]

const HTTP_TOO_MANY_REQUESTS = 429

const NETWORK_ERROR_CODE = "network"

class RideWithGpsError extends Error {
  constructor({message, status = null, code = null}) {
    super(message)

    this.name = "RideWithGpsError"
    this.status = status
    this.code = code
  }
}

const sleep = (durationMs) =>
  new Promise((resolve) => setTimeout(resolve, durationMs))

const getRetryAfterMs = (response) => {
  const retryAfterSeconds = Number(response.headers.get("retry-after"))

  return Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
    ? retryAfterSeconds * 1000
    : null
}

const readErrorMessage = async (response) => {
  try {
    const {errors} = await response.json()

    if (Array.isArray(errors) && errors.length > 0) return errors.join(", ")
  } catch {
    // Not the documented `{errors: [...]}` body, the status text says enough
  }

  return response.statusText
}

const requestRideWithGps = async ({
  path,
  method = "GET",
  headers = {},
  query = {},
  body,
  reporter,
}) => {
  const url = new URL(path, RIDEWITHGPS_URL)

  Object.entries(query).forEach(([name, value]) => {
    url.searchParams.set(name, value)
  })

  for (let attempt = 0; ; attempt++) {
    let response

    try {
      response = await fetch(url, {
        method,
        headers: {
          ...headers,
          ...(body && {"content-type": "application/json"}),
        },
        body: body && JSON.stringify(body),
      })
    } catch (error) {
      throw new RideWithGpsError({
        message: `[${method} ${url.pathname}] ${error.message}`,
        code: NETWORK_ERROR_CODE,
      })
    }

    const hasRetriesLeft = attempt < RATE_LIMIT_RETRY_DELAYS_MS.length

    if (response.status === HTTP_TOO_MANY_REQUESTS && hasRetriesLeft) {
      const waitMs =
        getRetryAfterMs(response) || RATE_LIMIT_RETRY_DELAYS_MS[attempt]

      if (reporter) {
        reporter.warn(
          `source-ridewithgps: Rate limited, retrying in ${Math.ceil(waitMs / 1000)}s`
        )
      }

      await sleep(waitMs)

      continue
    }

    if (!response.ok) {
      throw new RideWithGpsError({
        message: `[${method} ${url.pathname}] ${response.status} ${await readErrorMessage(response)}`,
        status: response.status,
      })
    }

    return response.json()
  }
}

const createRideWithGpsClient = ({apiKey, authToken, reporter}) => {
  const getAuthenticated = (path, query) =>
    requestRideWithGps({
      path,
      query,
      reporter,
      headers: {
        "x-rwgps-api-key": apiKey,
        "x-rwgps-auth-token": authToken,
      },
    })

  return {
    fetchSync: ({since}) =>
      getAuthenticated("/api/v1/sync.json", {since, assets: "routes"}),

    fetchRoute: async (routeId) =>
      (await getAuthenticated(`/api/v1/routes/${routeId}.json`)).route,

    fetchCurrentUser: async () =>
      (await getAuthenticated("/api/v1/users/current.json")).user,
  }
}

const createAuthToken = async ({apiKey, email, password}) => {
  const response = await requestRideWithGps({
    path: "/api/v1/auth_tokens.json",
    method: "POST",
    headers: {"x-rwgps-api-key": apiKey},
    body: {user: {email, password}},
  })

  return response.auth_token.auth_token
}

module.exports = {
  NETWORK_ERROR_CODE,
  RideWithGpsError,
  createAuthToken,
  createRideWithGpsClient,
}
