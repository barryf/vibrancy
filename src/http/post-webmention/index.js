const arc = require('@architect/functions')
const { jsonify } = require('@architect/shared/utils')

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
    return jsonify({
      error: 'unauthorized',
      error_description: 'Secret does not match.'
    }, 403)
  }

  const webmention = {
    source: body.source,
    target: body.target,
    published: body.post.published,
    'wm-property': body.post['wm-property'],
    properties: postToMf2(body.post)
  }
  data.webmentions.put({ webmention })

  await arc.queues.publish({
    name: 'write-github',
    payload: {
      folder: 'webmentions',
      source: body.source,
      target: body.target
    }
  })

  return {
    statusCode: 202
  }
}
