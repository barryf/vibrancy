const fetch = require('node-fetch')
const logger = require('@architect/shared/logger')

function getGranaryUrl (url) {
  const granaryBaseUrl = 'https://granary.io/'
  const safeUrl = encodeURIComponent(url)
  if (url.indexOf('https://twitter.com') > -1) {
    const status = url.split('/').slice(-1)[0]
    return `${granaryBaseUrl}twitter/@me/@all/@app/${status}?format=mf2-json` +
      `&access_token_key=${process.env.GRANARY_TWITTER_ACCESS_TOKEN_KEY}` +
      `&access_token_secret=${process.env.GRANARY_TWITTER_ACCESS_TOKEN_SECRET}`
  } else {
    return `${granaryBaseUrl}url?input=html&output=mf2-json&url=${safeUrl}`
  }
}

async function fetchContext (url) {
  const response = await fetch(getGranaryUrl(url))
  if (!response.ok) {
    const text = await response.text()
    logger.warn('Failed to fetch context from Granary', `${url}\n${text}`)
    return
  }
  const mf2 = await response.json()
  if (!('items' in mf2) || !mf2.items.length) return null
  return mf2.items[0].properties
}

module.exports = { fetchContext }
