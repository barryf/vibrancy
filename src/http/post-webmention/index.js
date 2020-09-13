const arc = require('@architect/functions')

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

  // TODO check secret matches

  // TODO store as file in github

  const webmention = {
    source: body.source,
    target: body.target,
    published: body.post.published,
    'wm-property': body.post['wm-property'],
    properties: postToMf2(body.post)
  }
  data.webmentions.put({ webmention })

  return {
    statusCode: 202
  }
}
