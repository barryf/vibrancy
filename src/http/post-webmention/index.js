const crypto = require('crypto')
const arc = require('@architect/functions')
const logger = require('@architect/shared/logger')

function wmType (wmProperty) {
  switch (wmProperty) {
    case 'in-reply-to':
      return 'comment'
    case 'like-of':
      return 'like'
    case 'mention-of':
      return 'mention'
    case 'repost-of':
      return 'repost'
    default:
      return 'webmention'
  }
}

function postToMf2 (post) {
  if ('deleted' in post && post.deleted) {
    return {
      deleted: [new Date().toISOString()]
    }
  }
  const properties = {
    url: [post.url],
    name: [post.name],
    published: [post.published],
    author: [{
      type: ['h-card'],
      properties: {
        name: [post.author.name],
        photo: [post.author.photo],
        url: [post.author.url]
      }
    }]
  }
  if ('content' in post) {
    if ('html' in post.content) {
      properties.content = [{ html: [post.content.html] }]
    } else {
      properties.content = [post.content.text]
    }
  }
  for (const prop of
    ['in-reply-to', 'like-of', 'repost-of', 'rsvp', 'bookmark-of']) {
    if (prop in post) properties[prop] = [post[prop]]
  }
  return properties
}

function createId (source, target) {
  return crypto.createHash('md5').update(`${source} ${target}`).digest('hex')
}

exports.handler = async function http (req) {
  const data = await arc.tables()
  const body = arc.http.helpers.bodyParser(req)

  if (!('secret' in body) || body.secret !== process.env.WEBMENTION_IO_SECRET) {
    logger.warn('Webmention secret does not match', JSON.stringify(body, null, 2))
    return {
      body: JSON.stringify({
        error: 'unauthorized',
        error_description: 'Secret does not match.'
      }),
      statusCode: 403
    }
  }

  const source = body.post.url
  const target = body.target
  const id = createId(source, target)
  const published = body.post.published || body.post['wm-received'] || new Date().toISOString()

  logger.info(`Webmention received from ${source}`, JSON.stringify(body, null, 2))

  const webmention = {
    id,
    source,
    target,
    published,
    'wm-property': body.post['wm-property'],
    properties: postToMf2(body.post)
  }
  await data.webmentions.put(webmention)

  await arc.events.publish({
    name: 'write-github',
    payload: {
      folder: 'webmentions',
      id
    }
  })

  // send pushover notification
  const payload = {
    url: target,
    title: `Received ${wmType(body.post['wm-property'])}`,
    message: source
  }
  if (('author' in body.post) && ('name' in body.post.author)) {
    payload.message = body.post.author.name + '\n' + source
  }
  await arc.events.publish({
    name: 'notify-push',
    payload
  })

  return {
    statusCode: 202
  }
}
