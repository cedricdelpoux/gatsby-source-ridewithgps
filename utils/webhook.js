const crypto = require("crypto")

const computeWebhookSignature = ({rawBody, clientSecret}) =>
  crypto.createHmac("sha256", clientSecret).update(rawBody).digest("hex")

const verifyWebhookSignature = ({rawBody, signature, clientSecret}) => {
  if (!rawBody || !signature || !clientSecret) return false

  const expectedSignature = Buffer.from(
    computeWebhookSignature({rawBody, clientSecret})
  )
  const receivedSignature = Buffer.from(signature)

  // `timingSafeEqual` throws on buffers of different lengths
  if (receivedSignature.length !== expectedSignature.length) return false

  return crypto.timingSafeEqual(receivedSignature, expectedSignature)
}

const hasRouteChanges = (notifications) =>
  Array.isArray(notifications) &&
  notifications.some((notification) => notification.item_type === "route")

module.exports = {hasRouteChanges, verifyWebhookSignature}
