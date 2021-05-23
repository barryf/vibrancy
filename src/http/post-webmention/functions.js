const crypto = require('crypto')

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
    name: post.name ? [post.name] : [],
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

module.exports = {
  createId,
  wmType,
  postToMf2
}
