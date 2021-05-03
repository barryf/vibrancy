const fetch = require('node-fetch')
const logger = require('@architect/shared/logger')

exports.handler = async function subscribe (event) {
  const { url } = JSON.parse(event.Records[0].Sns.Message)

  if (!process.env.NOTIFY_ENDPOINTS) {
    logger.error('No endpoints defined in NOTIFY_ENDPOINTS')
    return
  }

  const endpoints = process.env.NOTIFY_ENDPOINTS.split(/\s/)
  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    const result = await response.json()
    if (response.ok) {
      logger.info('Notify endpoint response', JSON.stringify(result, null, 2))
    } else {
      logger.error('Error notifying endpoint', JSON.stringify(result, null, 2))
    }
  }
}
