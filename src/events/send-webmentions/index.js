const cheerio = require('cheerio')
const fetch = require('node-fetch')
const logger = require('@architect/shared/logger')

async function findLinks (url) {
  const response = await fetch(url)
  const content = await response.text()
  const $ = cheerio.load(content)
  const allLinks = []
  $('a').each((_, tag) => {
    allLinks.push($(tag).attr('href'))
  })
  // filter out relative links or links to root
  const links = allLinks.filter(link => link.startsWith('http'))
  logger.info(`Found ${links.length} links at ${url}`, links.join('\n'))
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
  if (response.statusCode === 201) {
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
