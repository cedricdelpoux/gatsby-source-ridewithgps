const path = require("path")

const {createRideWithGpsClient} = require("./utils/ridewithgps.js")
const {normalizeRoute} = require("./utils/routes.js")
const {DEFAULT_STORE_DIR, createStore} = require("./utils/store.js")
const {isRideWithGpsUnreachable, syncRoutes} = require("./utils/sync.js")
const {types} = require("./utils/types.js")

const ROUTE_NODE_TYPE = "RideWithGpsRoute"

exports.createSchemaCustomization = ({actions}) => {
  actions.createTypes(types)
}

exports.sourceNodes = async (
  {actions, createContentDigest, reporter, store},
  pluginOptions = {}
) => {
  if (!pluginOptions.apiKey) {
    reporter.warn("source-ridewithgps: Missing `apiKey` option")
    return
  }

  if (!pluginOptions.authToken) {
    reporter.warn("source-ridewithgps: Missing `authToken` option")
    return
  }

  const routesOptions = pluginOptions.routes || {}

  try {
    const {directory} = store.getState().program
    const routesStore = createStore({
      dir: path.resolve(directory, pluginOptions.storeDir || DEFAULT_STORE_DIR),
    })

    const client = createRideWithGpsClient({
      apiKey: pluginOptions.apiKey,
      authToken: pluginOptions.authToken,
      reporter,
    })

    try {
      const {fetchedCount, deletedCount} = await syncRoutes({
        client,
        store: routesStore,
        withPinned: Boolean(routesOptions.withPinned),
        reporter,
      })

      reporter.success(
        `source-ridewithgps: ${fetchedCount} routes fetched, ${deletedCount} deleted`
      )
    } catch (error) {
      if (!isRideWithGpsUnreachable(error)) throw error

      reporter.warn(
        `source-ridewithgps: ${error.message}, using the stored routes instead`
      )
    }

    const routes = await routesStore.readRoutes()

    for (const route of routes) {
      const normalizedRoute = normalizeRoute(route)

      if (routesOptions.extend) {
        routesOptions.extend({route: normalizedRoute})
      }

      await actions.createNode({
        ...normalizedRoute,
        internal: {
          type: ROUTE_NODE_TYPE,
          contentDigest: createContentDigest(normalizedRoute),
        },
      })
    }
  } catch (error) {
    if (pluginOptions.debug) {
      reporter.panic(`source-ridewithgps: `, error)
    } else {
      reporter.panic(`source-ridewithgps: ${error.message}`)
    }
  }
}
