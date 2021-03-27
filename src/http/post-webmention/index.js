const arc = require('@architect/functions')
const logger = require('@architect/shared/logger')

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
  for (const prop in
    ['in-reply-to', 'like-of', 'repost-of', 'rsvp', 'bookmark-of']) {
    if (prop in post) properties[prop] = [post[prop]]
  }
  return properties
}

exports.handler = async function http (req) {
  const data = await arc.tables()
  const body = arc.http.helpers.bodyParser(req)

  if (!('secret' in body) || body.secret !== process.env.WEBMENTION_IO_SECRET) {
    logger.warn('Webmention secret does not match', JSON.stringify(body, null, 2))
    return {
      json: {
        error: 'unauthorized',
        error_description: 'Secret does not match.'
      },
      statusCode: 403
    }
  }

  const webmention = {
    source: body.source,
    target: body.target,
    published: body.post.published,
    'wm-property': body.post['wm-property'],
    properties: postToMf2(body.post)
  }
  data.webmentions.put({ webmention })

  logger.info(`Webmention received from ${body.source}`, JSON.stringify(body, null, 2))

  await arc.events.publish({
    name: 'write-github',
    payload: {
      folder: 'webmentions',
      source: body.source,
      target: body.target
    }
  })

  await arc.events.publish({
    name: 'notify-push',
    payload: {
      url: body.target,
      title: `Received ${body.post['wm-property']}`,
      message: body.source
    }
  })

  return {
    statusCode: 202
  }
}
