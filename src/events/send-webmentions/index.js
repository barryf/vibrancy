const cheerio = require('cheerio')
const fetch = require('node-fetch')
const logger = require('@architect/shared/logger')
const { isValidURL } = require('@architect/shared/utils')

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
    isValidURL(link)
  )
  logger.info(`Found ${links.length} link(s) at ${url}`, links.join('\n'))
  return links
}

async function sendWebmention (source, target) {
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
  const url = new URL(body.url, process.env.ROOT_URL).href
  const links = await findLinks(url)
  for (const link of links) {
    await sendWebmention(url, link)
  }
}
