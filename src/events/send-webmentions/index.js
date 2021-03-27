const Webmention = require('@remy/webmention')
const events = require('events')
const logger = require('@architect/shared/logger')

async function sendWebmentions (url, limit = 0, send = true) {
  const wm = new Webmention({ limit, send })
  wm.fetch(url)
  await events.once(wm, 'end')
  logger.info('Dispatched webmentions', JSON.stringify(wm.endpoints, null, 2))
}

exports.handler = async function subscribe (event) {
  const body = JSON.parse(event.Records[0].Sns.Message)
  await sendWebmentions(body.url)
}
