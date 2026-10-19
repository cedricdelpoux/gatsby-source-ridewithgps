const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const {beforeEach, test} = require("node:test")

const {RideWithGpsError} = require("../utils/ridewithgps.js")
const {createStore} = require("../utils/store.js")
const {planRouteChanges, syncRoutes} = require("../utils/sync.js")
const {route: routeFixture} = require("./fixtures/route.json")
const syncFixture = require("./fixtures/sync.json")

const CURRENT_USER_ID = 1

const buildRoute = (routeId) => ({
  ...routeFixture,
  id: Number(routeId),
  name: `Route ${routeId}`,
})

const createFakeClient = ({sync = syncFixture, missingRouteIds = []} = {}) => {
  const calls = {sinces: [], fetchedRouteIds: []}

  return {
    calls,
    fetchSync: async ({since}) => {
      calls.sinces.push(since)

      return sync
    },
    fetchRoute: async (routeId) => {
      calls.fetchedRouteIds.push(routeId)

      if (missingRouteIds.includes(routeId)) {
        throw new RideWithGpsError({message: "Not found", status: 404})
      }

      return buildRoute(routeId)
    },
    fetchCurrentUser: async () => ({id: CURRENT_USER_ID}),
  }
}

const readStoredRouteIds = async (store) =>
  (await store.readRoutes()).map(({id}) => String(id)).sort()

let store

beforeEach(() => {
  store = createStore({
    dir: fs.mkdtempSync(path.join(os.tmpdir(), "ridewithgps-store-")),
  })
})

test("syncRoutes starts from 1970 on an empty store", async () => {
  const client = createFakeClient()

  await syncRoutes({client, store})

  assert.deepEqual(client.calls.sinces, ["1970-01-01"])
})

test("syncRoutes writes the created and updated routes", async () => {
  const client = createFakeClient()

  await syncRoutes({client, store})

  assert.deepEqual(client.calls.fetchedRouteIds.sort(), ["101", "201"])
  assert.deepEqual(await readStoredRouteIds(store), ["101", "201"])
})

test("syncRoutes overwrites an updated route already stored", async () => {
  await store.writeRoute({...buildRoute("101"), name: "Outdated name"})

  await syncRoutes({client: createFakeClient(), store})

  assert.equal((await store.readRoute("101")).name, "Route 101")
})

test("syncRoutes removes the deleted routes from the store", async () => {
  await store.writeRoute(buildRoute("102"))

  const {deletedCount} = await syncRoutes({client: createFakeClient(), store})

  assert.equal(await store.readRoute("102"), null)
  assert.equal(deletedCount, 1)
})

test("syncRoutes keeps the cursor for the next sync", async () => {
  await syncRoutes({client: createFakeClient(), store})

  const client = createFakeClient({sync: {items: [], meta: syncFixture.meta}})

  await syncRoutes({client, store})

  assert.deepEqual(client.calls.sinces, [syncFixture.meta.rwgps_datetime])
})

test("syncRoutes does not move the cursor when a fetch fails", async () => {
  const client = createFakeClient()

  client.fetchRoute = async () => {
    throw new RideWithGpsError({message: "Unavailable", status: 503})
  }

  await assert.rejects(syncRoutes({client, store}))
  assert.equal((await store.readState()).rwgpsDatetime, undefined)
})

test("syncRoutes drops a route that can no longer be fetched", async () => {
  await store.writeRoute(buildRoute("201"))

  await syncRoutes({
    client: createFakeClient({missingRouteIds: ["201"]}),
    store,
  })

  assert.deepEqual(await readStoredRouteIds(store), ["101"])
})

test("syncRoutes ignores the pinned routes by default", async () => {
  const client = createFakeClient()

  await syncRoutes({client, store})

  assert.equal(client.calls.fetchedRouteIds.includes("301"), false)
})

test("syncRoutes fetches the pinned routes with withPinned", async () => {
  await syncRoutes({client: createFakeClient(), store, withPinned: true})

  assert.deepEqual(await readStoredRouteIds(store), ["101", "201", "301"])
})

test("syncRoutes starts over when withPinned changes", async () => {
  await syncRoutes({client: createFakeClient(), store})

  const client = createFakeClient()

  await syncRoutes({client, store, withPinned: true})

  assert.deepEqual(client.calls.sinces, ["1970-01-01"])
  assert.deepEqual(await readStoredRouteIds(store), ["101", "201", "301"])
})

const buildSyncItem = ({routeId, action, minute, itemUserId = 1}) => ({
  item_type: "route",
  item_id: routeId,
  item_user_id: itemUserId,
  item_url: `https://ridewithgps.com/api/v1/routes/${routeId}.json`,
  action,
  datetime: `2024-09-05T06:${String(minute).padStart(2, "0")}:00Z`,
  collection:
    action === "added" || action === "removed"
      ? {id: 2, type: "pinned", url: null}
      : null,
})

test("planRouteChanges applies the actions in chronological order", () => {
  const items = [
    buildSyncItem({routeId: 1, action: "deleted", minute: 2}),
    buildSyncItem({routeId: 1, action: "created", minute: 1}),
  ]

  assert.deepEqual(planRouteChanges({items, withPinned: false}), {
    routeIdsToFetch: [],
    routeIdsToDelete: ["1"],
  })
})

test("planRouteChanges keeps an own route after it is unpinned", () => {
  const items = [
    buildSyncItem({routeId: 1, action: "created", minute: 1}),
    buildSyncItem({routeId: 1, action: "added", minute: 2}),
    buildSyncItem({routeId: 1, action: "removed", minute: 3}),
    buildSyncItem({routeId: 2, action: "added", minute: 4, itemUserId: 2}),
    buildSyncItem({routeId: 2, action: "removed", minute: 5, itemUserId: 2}),
  ]

  assert.deepEqual(
    planRouteChanges({items, withPinned: true, currentUserId: CURRENT_USER_ID}),
    {routeIdsToFetch: ["1"], routeIdsToDelete: ["2"]}
  )
})
