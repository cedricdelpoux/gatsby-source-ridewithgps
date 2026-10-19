const {NETWORK_ERROR_CODE} = require("./ridewithgps.js")

const INITIAL_SYNC_SINCE = "1970-01-01"

const ROUTE_FETCH_CONCURRENCY = 4

const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404

const FETCH_ROUTE = "fetch"
const DELETE_ROUTE = "delete"

const isRouteItem = (item) => item.item_type === "route"

const isInPinnedCollection = (item) =>
  !item.collection || item.collection.type === "pinned"

const isRouteUnpin = (item) =>
  isRouteItem(item) && item.action === "removed" && isInPinnedCollection(item)

const sortByDatetime = (items) =>
  [...items].sort(
    (first, second) => Date.parse(first.datetime) - Date.parse(second.datetime)
  )

// Replayed in order, so that a route created then deleted since the last sync
// ends up deleted. Unpinning only drops the routes of other users.
const planRouteChanges = ({items, withPinned, currentUserId}) => {
  const changeByRouteId = new Map()

  sortByDatetime(items.filter(isRouteItem)).forEach((item) => {
    const routeId = String(item.item_id)

    switch (item.action) {
      case "created":
      case "updated":
        changeByRouteId.set(routeId, FETCH_ROUTE)
        break
      case "deleted":
        changeByRouteId.set(routeId, DELETE_ROUTE)
        break
      case "added":
        if (withPinned && isInPinnedCollection(item)) {
          changeByRouteId.set(routeId, FETCH_ROUTE)
        }
        break
      case "removed":
        if (
          withPinned &&
          isInPinnedCollection(item) &&
          item.item_user_id !== currentUserId
        ) {
          changeByRouteId.set(routeId, DELETE_ROUTE)
        }
        break
    }
  })

  const getRouteIdsWithChange = (change) =>
    [...changeByRouteId]
      .filter(([, routeChange]) => routeChange === change)
      .map(([routeId]) => routeId)

  return {
    routeIdsToFetch: getRouteIdsWithChange(FETCH_ROUTE),
    routeIdsToDelete: getRouteIdsWithChange(DELETE_ROUTE),
  }
}

const runWithConcurrency = async ({values, concurrency, run}) => {
  const pendingValues = [...values]

  const runUntilNoneIsPending = async () => {
    while (pendingValues.length > 0) {
      await run(pendingValues.shift())
    }
  }

  await Promise.all(Array.from({length: concurrency}, runUntilNoneIsPending))
}

const isRouteGone = (error) =>
  error.status === HTTP_NOT_FOUND || error.status === HTTP_FORBIDDEN

const isRideWithGpsUnreachable = (error) =>
  error.code === NETWORK_ERROR_CODE || error.status >= 500

// The cursor only moves once every change is in the store, so that a build
// stopped halfway applies the same items again next time. A `withPinned`
// change starts over, the earlier pins having been skipped or kept for good.
const syncRoutes = async ({client, store, withPinned = false, reporter}) => {
  const storedState = await store.readState()
  const hasPinnedOptionChanged = Boolean(storedState.withPinned) !== withPinned

  if (hasPinnedOptionChanged && storedState.rwgpsDatetime) {
    await store.deleteAllRoutes()
  }

  const since =
    !hasPinnedOptionChanged && storedState.rwgpsDatetime
      ? storedState.rwgpsDatetime
      : INITIAL_SYNC_SINCE

  const {items, meta} = await client.fetchSync({since})

  const currentUserId =
    withPinned && items.some(isRouteUnpin)
      ? (await client.fetchCurrentUser()).id
      : null

  const {routeIdsToFetch, routeIdsToDelete} = planRouteChanges({
    items,
    withPinned,
    currentUserId,
  })

  if (reporter && routeIdsToFetch.length > 0) {
    reporter.info(
      `source-ridewithgps: Fetching ${routeIdsToFetch.length} routes changed since ${since}`
    )
  }

  const goneRouteIds = []

  await runWithConcurrency({
    values: routeIdsToFetch,
    concurrency: ROUTE_FETCH_CONCURRENCY,
    run: async (routeId) => {
      try {
        await store.writeRoute(await client.fetchRoute(routeId))
      } catch (error) {
        if (!isRouteGone(error)) throw error

        goneRouteIds.push(routeId)
      }
    },
  })

  for (const routeId of [...routeIdsToDelete, ...goneRouteIds]) {
    await store.deleteRoute(routeId)
  }

  await store.writeState({rwgpsDatetime: meta.rwgps_datetime, withPinned})

  return {
    fetchedCount: routeIdsToFetch.length - goneRouteIds.length,
    deletedCount: routeIdsToDelete.length + goneRouteIds.length,
  }
}

module.exports = {isRideWithGpsUnreachable, planRouteChanges, syncRoutes}
