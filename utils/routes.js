const path = require("path")

const {createRideWithGpsClient} = require("./ridewithgps.js")
const {DEFAULT_STORE_DIR, createStore} = require("./store.js")
const {syncRoutes} = require("./sync.js")

const PUBLIC_VISIBILITY = "public"

const hasCoordinates = (trackPoint) =>
  typeof trackPoint.x === "number" && typeof trackPoint.y === "number"

// Same `[lng, lat]` order as `gatsby-source-strava`, so that a map or
// `gatsby-strava-tiles` reads both plugins the same way
const getCoordinates = (trackPoints = []) =>
  trackPoints.filter(hasCoordinates).map(({x, y}) => [x, y])

// `track_points` stays out of the node: a route holds thousands of them, and
// `coordinates` already carries all a map needs
const normalizeRoute = (route) => {
  const {track_points: trackPoints, ...routeWithoutTrackPoints} = route
  const coordinates = getCoordinates(trackPoints)

  return {
    ...routeWithoutTrackPoints,
    id: String(route.id),
    private: route.visibility !== PUBLIC_VISIBILITY,
    ...(coordinates.length > 0 && {coordinates}),
  }
}

// A serverless function has to pass a writable `storeDir`, such as `/tmp`
const getRoutes = async ({
  apiKey,
  authToken,
  storeDir = DEFAULT_STORE_DIR,
  withPinned = false,
}) => {
  const store = createStore({dir: path.resolve(storeDir)})
  const client = createRideWithGpsClient({apiKey, authToken})

  await syncRoutes({client, store, withPinned})

  return (await store.readRoutes()).map(normalizeRoute)
}

module.exports = {getRoutes, normalizeRoute}
