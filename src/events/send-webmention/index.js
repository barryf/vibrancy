const logger = require('@architect/shared/logger')

async function sendWebmention (source, target) {
  if (!process.env.TELEGRAPH_TOKEN) return

  const response = await fetch('https://telegraph.p3k.io/webmention', {
    method: 'post',
    body: new URLSearchParams({
      token: process.env.TELEGRAPH_TOKEN,
      source,
      target
    })
  })
  const json = await response.json()
  const message = JSON.stringify(json, null, 2)
  if (response.ok) {
    logger.info(`Queued webmention with Telegraph from ${source} to ${target}`, message)
  } else {
    logger.error(`Error received from Telegraph for ${source} to ${target}`, message)
  }
}

exports.handler = async function subscribe (event) {
  const body = JSON.parse(event.Records[0].Sns.Message)
  await sendWebmention(body.source, body.target)
}
