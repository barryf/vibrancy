const fetch = require('node-fetch')
const crypto = require('crypto')
const logger = require('@architect/shared/logger')

const statusIdFromUrl = url => {
  const statusId = url.split('/').pop()
  return statusId
}

function generateStatus (post) {
  const absoluteUrl = new URL(post.url, process.env.ROOT_URL).href
  let content = ''
  if (post.properties.summary) {
    content = post.properties.summary[0] + ' ' + absoluteUrl
  } else if (post.properties.name) {
    content = post.properties.name[0] + ' ' + absoluteUrl
  } else if (post.properties.content &&
    typeof post.properties.content[0] === 'string') {
    content = post.properties.content[0]
  }

  const status = {
    status: content
  }

  // add in-reply-to if appropriate (we assume it will be first reply url)
  if (post.properties['in-reply-to']) {
    const statusId = statusIdFromUrl(post.properties['in-reply-to'][0])
    status.in_reply_to_id = statusId
  }

  return status
}

async function syndicate (post) {
  const status = generateStatus(post)
  const key = crypto.createHash('md5').update(status.status).digest('hex')
  const token = process.env.MASTODON_TOKEN
  const server = process.env.MASTODON_URL.split('@')[0]
  const response = await fetch(`${server}api/v1/statuses`, {
    method: 'post',
    headers: {
      'Idempotency-Key': key,
      Authorization: `Bearer ${token}`
    },
    body: new URLSearchParams(status)
  })
  const toot = await response.json()
  logger.info('Mastodon response', JSON.stringify(toot, null, 2))
  const url = `${process.env.MASTODON_URL}/${toot.id}`
  return url
}

module.exports = { syndicate }
