const fetch = require('node-fetch')
const logger = require('@architect/shared/logger')

async function send ({ message, title = null, url = null }) {
  const token = process.env.PUSHOVER_TOKEN
  const user = process.env.PUSHOVER_USER
  if (!token || !user) {
    logger.warn('Pushover ENV variable is missing')
    return
  }
  const body = { token, user, message }
  if (title) body.title = title
  if (url) body.url = url

  const response = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    body: new URLSearchParams(body)
  })
  if (response.statusCode < 300) {
    logger.error('Pushover request failed', JSON.stringify(response, null, 2))
  }
}

exports.handler = async function subscribe (event) {
  const body = JSON.parse(event.Records[0].Sns.Message)
  await send(body)
}
