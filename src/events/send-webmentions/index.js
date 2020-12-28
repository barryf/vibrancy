const Webmention = require('@remy/webmention')
const events = require('events')

async function sendWebmentions (url, limit = 0, send = true) {
  const wm = new Webmention({ limit, send })
  wm.fetch(url)
  await events.once(wm, 'end')
  console.log('Dispatched', wm.endpoints)
}

exports.handler = async function subscribe (event) {
  const body = JSON.parse(event.Records[0].Sns.Message)
  await sendWebmentions(body.url)
}
