const assert = require("node:assert/strict")
const crypto = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")
const {test} = require("node:test")

const {hasRouteChanges, verifyWebhookSignature} = require("../utils/webhook.js")

const CLIENT_SECRET = "api-client-secret"

const rawBody = fs.readFileSync(
  path.join(__dirname, "fixtures", "webhook.json"),
  "utf8"
)

// Computed the way the RideWithGPS webhook documentation does
const signature = crypto
  .createHmac("sha256", CLIENT_SECRET)
  .update(rawBody)
  .digest("hex")

test("verifyWebhookSignature accepts the signature of the raw body", () => {
  assert.equal(
    verifyWebhookSignature({rawBody, signature, clientSecret: CLIENT_SECRET}),
    true
  )
})

test("verifyWebhookSignature rejects a body changed after signing", () => {
  assert.equal(
    verifyWebhookSignature({
      rawBody: rawBody.replace("deleted", "created"),
      signature,
      clientSecret: CLIENT_SECRET,
    }),
    false
  )
})

test("verifyWebhookSignature rejects another client secret", () => {
  assert.equal(
    verifyWebhookSignature({rawBody, signature, clientSecret: "other-secret"}),
    false
  )
})

test("verifyWebhookSignature rejects a signature of another length", () => {
  assert.equal(
    verifyWebhookSignature({
      rawBody,
      signature: signature.slice(1),
      clientSecret: CLIENT_SECRET,
    }),
    false
  )
})

test("verifyWebhookSignature rejects a missing signature", () => {
  assert.equal(
    verifyWebhookSignature({
      rawBody,
      signature: null,
      clientSecret: CLIENT_SECRET,
    }),
    false
  )
})

test("hasRouteChanges is true when a notification is about a route", () => {
  assert.equal(hasRouteChanges(JSON.parse(rawBody).notifications), true)
})

test("hasRouteChanges is false for trips only", () => {
  assert.equal(
    hasRouteChanges([{item_type: "trip", item_id: 1, action: "created"}]),
    false
  )
})

test("hasRouteChanges is false without notifications", () => {
  assert.equal(hasRouteChanges(undefined), false)
})
