const fetch = require('node-fetch')
const crypto = require('crypto')
const logger = require('@architect/shared/logger')

function generateStatus (post) {
  const absoluteUrl = new URL(post.url, process.env.ROOT_URL).href
  if (post.properties.summary) {
    return post.properties.summary[0] + ' ' + absoluteUrl
  } else if (post.properties.name) {
    return post.properties.name[0] + ' ' + absoluteUrl
  } else if (post.properties.content &&
    typeof post.properties.content[0] === 'string') {
    return post.properties.content[0]
  } else if (post.properties['repost-of']) {
    return post.properties['repost-of'][0]
  }
}

async function syndicate (post) {
  const text = generateStatus(post)
  const key = crypto.createHash('md5').update(text).digest('hex')
  const token = process.env.MASTODON_TOKEN
  const server = process.env.MASTODON_URL.split('@')[0]
  const response = await fetch(`${server}api/v1/statuses`, {
    method: 'post',
    headers: {
      'Idempotency-Key': key,
      Authorization: `Bearer ${token}`
    },
    body: new URLSearchParams({
      status: text
    })
  })
  if (response.statusCode >= 300) return
  const status = await response.json()
  logger.info('Mastodon response', JSON.stringify(status, null, 2))
  const url = `${process.env.MASTODON_URL}/${status.id}`
  return url
}

module.exports = { syndicate }
