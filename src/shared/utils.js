// Properties that should always remain as arrays
const arrayProperties = [
  'category',
  'syndication',
  'in-reply-to',
  'repost-of',
  'like-of',
  'bookmark-of',
  'comment',
  'like',
  'repost',
  'rsvp',
  'bookmark'
]

const reservedUrls = `
  notes
  articles
  bookmarks
  photos
  checkins
  reposts
  likes
  replies
  archives
  events
  rss
`.trim().split(/\s+/)

function derivePostType (post) {
  // See https://www.w3.org/TR/post-type-discovery/
  let content = ''
  if ('content' in post) {
    if (typeof post.content === 'string') {
      content = post.content.trim()
    } else {
      content = post.content.html.trim()
    }
  }
  if (('type' in post) && post.type === 'event') {
    return 'event'
  } else if (('rsvp' in post) &&
    ['yes', 'no', 'maybe', 'interested'].includes(post.rsvp)) {
    return 'rsvp'
  } else if (('in-reply-to' in post) &&
    isValidURL(post['in-reply-to'])) {
    return 'in-reply-to'
  } else if (('repost-of' in post) &&
    isValidURL(post['repost-of'])) {
    return 'repost-of'
  } else if (('like-of' in post) &&
    isValidURL(post['like-of'])) {
    return 'like-of'
  } else if (('video' in post) &&
    isValidURL(post.video)) {
    return 'video'
  } else if (('photo' in post) &&
    isValidURL(post.photo)) {
    return 'photo'
  } else if (('bookmark-of' in post) &&
    isValidURL(post['bookmark-of'])) {
    return 'bookmark-of'
  } else if (('name' in post) &&
    (post.name.trim() !== '') && !content.startsWith(post.name.trim())) {
    return 'article'
  } else if ('checkin' in post) {
    return 'checkin'
  } else {
    return 'note'
  }
}

function isValidURL (string) {
  try {
    new URL(string) // eslint-disable-line
  } catch (_) {
    return false
  }
  return true
}

function flattenJSON (post) {
  for (const key in post) {
    if (Array.isArray(post[key]) && post[key].length === 1 &&
      !arrayProperties.includes(key)) {
      post[key] = post[key][0]
    }
  }
}

function flattenFormEncoded (post) {
  for (const key in post) {
    if (key === 'content[html]') {
      post.content = { html: post[key] }
      delete post['content[html]']
    } else if (arrayProperties.includes(key)) {
      post[key] = [post[key]]
    }
  }
}

function unflatten (post) {
  for (const key in post) {
    if (!Array.isArray(post[key])) {
      post[key] = [post[key]]
    }
  }
}

function sanitise (post) {
  const reservedProperties = ['action', 'access_token', 'h']
  for (const prop in post) {
    if (prop.startsWith('mp-') || reservedProperties.includes(prop)) {
      delete post[prop]
    }
    if (prop.endsWith('[]')) {
      const propModified = prop.slice(0, -2)
      post[propModified] = post[prop]
      delete post[prop]
    }
  }
}

exports.utils = {
  derivePostType,
  isValidURL,
  flattenJSON,
  flattenFormEncoded,
  unflatten,
  sanitise,
  reservedUrls
}
