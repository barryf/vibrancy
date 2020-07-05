// const arc = require('@architect/functions')

const isValidUrl = function (string) {
  try {
    new URL(string) // eslint-disable-line
  } catch (_) {
    return false
  }
  return true
}

function derivePostType (post) {
  if (('rsvp' in post) &&
    ['yes', 'no', 'maybe', 'interested'].includes(post.rsvp)) {
    return 'rsvp'
  } else if (('in-reply-to' in post) &&
    isValidUrl(post['in-reply-to'])) {
    return 'in-reply-to'
  } else if (('repost-of' in post) &&
    isValidUrl(post['repost-of'])) {
    return 'repost-of'
  } else if (('like-of' in post) &&
    isValidUrl(post['like-of'])) {
    return 'like-of'
  } else if (('video' in post) &&
    isValidUrl(post.video)) {
    return 'video'
  } else if (('photo' in post) &&
    isValidUrl(post.photo)) {
    return 'photo'
  } else if (('bookmark-of' in post) &&
    isValidUrl(post['bookmark-of'])) {
    return 'bookmark-of'
  } else if (('name' in post) &&
    (post.name !== '')) { // also !content_start_with_name
    return 'article'
  } else if ('checkin' in post) {
    return 'checkin'
  } else {
    return 'note'
  }
}

function deriveSlug (post) {
  // if the request passed mp-slug, make sure it's in the right format
  if ('mp-slug' in post && post['mp-slug'] !== '' &&
    post['mp-slug'].match(/^[a-z0-9][a-z0-9/-]*$/)) {
    return post['mp-slug']
  }
  // convert published string to a date object and construct yyyy/mm prefix
  const published = new Date(post.published)
  const yyyy = published.getFullYear().toString()
  const m = (published.getMonth() + 1).toString()
  const mm = m.length === 1 ? `0${m}` : m
  const prefix = `${yyyy}/${mm}/`
  // try to make a sensible slug from content/summary either in text or html
  let content = ''
  if ('name' in post) {
    content = post.name
  } else if ('summary' in post) {
    content = post.name
  } else if ('content' in post) {
    if (typeof post.content === 'object' &&
      'html' in post.content) {
      content = post.content.html
    } else {
      content = post.content
    }
  }
  // we don't have sensible text to use so create a random string of letters
  if (content === '') {
    return prefix + Math.random().toString(36).substring(2, 15)
  }
  // use first 6 words from content
  return prefix + content.toLowerCase().replace(/[^\w-]/g, ' ').trim()
    .replace(/[\s-]+/g, ' ').replace(/ /g, '-').split('-').slice(0, 6).join('-')
}

function flatten (post) {
  for (const key in post) {
    if (Array.isArray(post[key]) && post[key].length === 1) {
      post[key] = post[key][0]
    }
  }
}

function sanitise (post) {
  for (const prop in post) {
    if (prop.startsWith('mp-') || prop === 'h') {
      delete post[prop]
    }
  }
}

const formatPost = async function (bodypost) {
  const post = { ...bodypost }
  flatten(post)
  post.published = post.published || new Date().toISOString()
  post.slug = deriveSlug(post)
  post['post-type'] = derivePostType(post)
  sanitise(post)
  return post
}

exports.micropub = { formatPost, isValidUrl }
