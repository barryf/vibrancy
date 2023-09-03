const cheerio = require('cheerio')
const logger = require('@architect/shared/logger')
const { isValidURL } = require('@architect/shared/utils')

const denyListHosts = [
  'twitter.com',
  'mobile.twitter.com',
  'maps.google.com',
  'pca.st',
  'github.com',
  'res.cloudinary.com',
  'www.swarmapp.com',
  'mastodon.social'
]

async function findLinks (url) {
  const response = await fetch(url)
  const content = await response.text()
  const $ = cheerio.load(content)
  // find all <a> tags inside h-entry
  const allLinks = []
  $('.h-entry a').each((_, tag) => {
    allLinks.push($(tag).attr('href'))
  })
  // filter out invalid links
  const links = allLinks.filter(link =>
    link.startsWith('http') &&
    !link.startsWith('http://localhost') &&
    !(denyListHosts.includes(new URL(link).host)) &&
    isValidURL(link)
  )
  logger.info(`Found ${links.length} link(s) at ${url}`, links.join('\n'))
  return links
}

module.exports = findLinks
