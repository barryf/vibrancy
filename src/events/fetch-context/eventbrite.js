const fetch = require('node-fetch')
const logger = require('@architect/shared/logger')

async function isEventbriteUrl (url) {
  return ((url.indexOf('https://eventbrite.com') > -1) ||
    (url.indexOf('https://www.eventbrite.com') > -1) ||
    (url.indexOf('https://eventbrite.co.uk') > -1) ||
    (url.indexOf('https://www.eventbrite.co.uk') > -1))
}

async function getEventbriteUrl (url) {
  const parsed = new URL(url)
  return 'https://eventbrite-mf2.herokuapp.com' + parsed.pathname
}

async function fetchContext (url) {
  if (!isEventbriteUrl(url)) {
    return
  }
  const response = await fetch(getEventbriteUrl(url))
  if (!response.ok) {
    const text = await response.text()
    logger.warn('Failed to fetch context from Eventbrite-MF2', `${url}\n${text}`)
    return
  }
  const mf2 = await response.json()
  if (!('items' in mf2) || !mf2.items.length) return
  return mf2.items[0].properties
}

module.exports = {
  isEventbriteUrl,
  fetchContext
}
