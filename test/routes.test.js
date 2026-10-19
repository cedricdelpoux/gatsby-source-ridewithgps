const assert = require("node:assert/strict")
const {test} = require("node:test")

const {normalizeRoute} = require("../utils/routes.js")
const {route} = require("./fixtures/route.json")

test("normalizeRoute turns the id into a string", () => {
  assert.equal(normalizeRoute(route).id, "101")
})

test("normalizeRoute exposes the track points as [lng, lat] coordinates", () => {
  assert.deepEqual(normalizeRoute(route).coordinates, [
    [1.4442, 43.6045],
    [1.4501, 43.6102],
    [1.444, 43.6047],
  ])
})

test("normalizeRoute drops the raw track points", () => {
  assert.equal("track_points" in normalizeRoute(route), false)
})

test("normalizeRoute marks every visibility but public as private", () => {
  const visibilities = {
    public: false,
    followers_only: true,
    mutual_followers_only: true,
    private: true,
  }

  Object.entries(visibilities).forEach(([visibility, isPrivate]) => {
    assert.equal(normalizeRoute({...route, visibility}).private, isPrivate)
  })
})

test("normalizeRoute keeps the other fields untouched", () => {
  const normalizedRoute = normalizeRoute(route)

  assert.equal(normalizedRoute.name, route.name)
  assert.equal(normalizedRoute.distance, route.distance)
  assert.equal(normalizedRoute.elevation_gain, route.elevation_gain)
  assert.deepEqual(normalizedRoute.activity_types, route.activity_types)
  assert.deepEqual(normalizedRoute.course_points, route.course_points)
})

test("normalizeRoute leaves out coordinates for a route without a track", () => {
  const routeWithoutTrack = {...route, track_points: []}

  assert.equal("coordinates" in normalizeRoute(routeWithoutTrack), false)
})
