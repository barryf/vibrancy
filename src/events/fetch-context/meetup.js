const logger = require('@architect/shared/logger')

function name () {
  return 'Meetup'
}

function isMeetupUrl (url) {
  return ((url.indexOf('https://meetup.com') > -1) ||
    (url.indexOf('https://www.meetup.com') > -1))
}

function getMeetupUrl (url) {
  const parsed = new URL(url)
  return 'https://meetup-mf2.herokuapp.com' + parsed.pathname
}

async function fetchContext (url) {
  if (!isMeetupUrl(url)) {
    return
  }
  const response = await fetch(getMeetupUrl(url))
  if (!response.ok) {
    const text = await response.text()
    logger.warn('Failed to fetch context from Meetup-MF2', `${url}\n${text}`)
    return
  }
  const mf2 = await response.json()
  if (!('items' in mf2) || !mf2.items.length) return
  return mf2.items[0].properties
}

module.exports = {
  name,
  isMeetupUrl,
  fetchContext
}
