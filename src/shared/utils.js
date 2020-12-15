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
  if ('content' in post.properties) {
    if (typeof post.properties.content[0] === 'string') {
      content = post.properties.content[0].trim()
    } else {
      content = post.properties.content[0].html.trim()
    }
  }
  if (('rsvp' in post.properties) &&
    ['yes', 'no', 'maybe', 'interested'].includes(post.properties.rsvp[0])) {
    return 'rsvp'
  } else if (('in-reply-to' in post.properties) &&
    isValidURL(post.properties['in-reply-to'][0])) {
    return 'reply'
  } else if (('repost-of' in post.properties) &&
    isValidURL(post.properties['repost-of'][0])) {
    return 'repost'
  } else if (('like-of' in post.properties) &&
    isValidURL(post.properties['like-of'][0])) {
    return 'like'
  } else if (('video' in post.properties) &&
    isValidURL(post.properties.video[0])) {
    return 'video'
  } else if (('photo' in post.properties) &&
    isValidURL(post.properties.photo[0])) {
    return 'photo'
  } else if (('bookmark-of' in post.properties) &&
    isValidURL(post.properties['bookmark-of'][0])) {
    return 'bookmark'
  } else if (('name' in post.properties) &&
    (post.properties.name[0].trim() !== '') &&
    !content.startsWith(post.properties.name[0].trim())) {
    return 'article'
  } else if ('checkin' in post.properties) {
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

module.exports = {
  derivePostType,
  isValidURL,
  reservedUrls
}
