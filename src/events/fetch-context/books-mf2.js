const fetch = require('node-fetch')
const logger = require('@architect/shared/logger')

function name () {
  return 'Books-MF2'
}

function isBooksMf2Url (url) {
  return (url.indexOf('https://books-mf2.herokuapp.com/') > -1)
}

async function fetchContext (url) {
  if (!isBooksMf2Url(url)) {
    return
  }
  const response = await fetch(url)
  if (!response.ok) {
    const text = await response.text()
    logger.warn('Failed to fetch context from Books-MF2', `${url}\n${text}`)
    return
  }
  const mf2 = await response.json()
  if (!('items' in mf2) || !mf2.items.length) return
  return mf2.items[0].properties
}

module.exports = {
  name,
  isBooksMf2Url,
  fetchContext
}
