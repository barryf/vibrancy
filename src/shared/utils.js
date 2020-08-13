function derivePostType (post) {
  if (('rsvp' in post) &&
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
    (post.name !== '')) { // TODO also !content_start_with_name
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

function flatten (post) {
  for (const key in post) {
    if (Array.isArray(post[key]) && post[key].length === 1) {
      post[key] = post[key][0]
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
`.trim().split(/\s+/)

exports.utils = {
  derivePostType,
  isValidURL,
  flatten,
  unflatten,
  sanitise,
  reservedUrls
}
