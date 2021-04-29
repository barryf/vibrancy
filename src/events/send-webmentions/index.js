const Webmention = require('@remy/webmention')
const events = require('events')
const logger = require('@architect/shared/logger')

async function sendWebmentions (url, limit = 0, send = true) {
  const wm = new Webmention({ limit, send })
  wm.fetch(url)
  await events.once(wm, 'end')
  if (Array.isArray(wm.endpoints) && wm.endpoints.length) {
    logger.info(`Sent ${wm.endpoints} webmentions`, JSON.stringify(wm.endpoints, null, 2))
  }
}

exports.handler = async function subscribe (event) {
  const body = JSON.parse(event.Records[0].Sns.Message)
  const url = new URL(body.url, process.env.ROOT_URL).href
  await sendWebmentions(url)
}
