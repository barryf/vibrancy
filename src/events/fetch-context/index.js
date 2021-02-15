const arc = require('@architect/functions')
const fetch = require('node-fetch')

const granaryBaseUrl = 'https://granary.io/'

function getGranaryUrl (url) {
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
  if (response.statusCode >= 400) {
    const text = await response.text()
    console.log('Failed to fetch context', url, text)
    return null
  }
  const mf2 = await response.json()
  if (!('items' in mf2) || !mf2.items.length) return null
  return mf2.items[0].properties
}

exports.handler = async function subscribe (event) {
  const data = await arc.tables()
  const { url } = JSON.parse(event.Records[0].Sns.Message)
  const properties = await fetchContext(url)
  await data.contexts.put({
    url,
    properties
  })
}
