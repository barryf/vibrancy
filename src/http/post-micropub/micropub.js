// const arc = require('@architect/functions')

const isValidUrl = function (string) {
  try {
    new URL(string) // eslint-disable-line
  } catch (_) {
    return false
  }
  return true
}

function derivePostType (properties) {
  if (('rsvp' in properties) &&
    ['yes', 'no', 'maybe', 'interested'].includes(properties.rsvp[0])) {
    return 'rsvp'
  } else if (('in-reply-to' in properties) &&
    isValidUrl(properties['in-reply-to'][0])) {
    return 'in-reply-to'
  } else if (('repost-of' in properties) &&
    isValidUrl(properties['repost-of'][0])) {
    return 'repost-of'
  } else if (('like-of' in properties) &&
    isValidUrl(properties['like-of'][0])) {
    return 'like-of'
  } else if (('video' in properties) &&
    isValidUrl(properties.video[0])) {
    return 'video'
  } else if (('photo' in properties) &&
    isValidUrl(properties.photo[0])) {
    return 'photo'
  } else if (('bookmark-of' in properties) &&
    isValidUrl(properties['bookmark-of'][0])) {
    return 'bookmark-of'
  } else if (('name' in properties) &&
    (properties.name !== '')) { // also !content_start_with_name
    return 'article'
  } else if ('checkin' in properties) {
    return 'checkin'
  } else {
    return 'note'
  }
}

function deriveSlug (properties) {
  if ('mp-slug' in properties && properties['mp-slug'] !== '') {
    // TODO: validate mp-slug format is foo or /yyyy/mm/foo
    return properties['mp-slug']
  }

  const published = new Date(properties.published)
  const yyyy = published.getFullYear().toString()
  const m = (published.getMonth() + 1).toString()
  const mm = m.length === 1 ? `0${m}` : m
  const prefix = `${yyyy}/${mm}/`

  let content = ''
  if ('name' in properties) {
    content = properties.name
  } else if ('summary' in properties) {
    content = properties.name
  } else if ('content' in properties) {
    if (typeof properties.content === 'object' &&
      'html' in properties.content) {
      content = properties.content.html
    } else {
      content = properties.content
    }
  }
  if (content === '') {
    return prefix + Math.random().toString(36).substring(2, 15)
  }
  return prefix + content.toLowerCase().replace(/[^\w-]/g, ' ').trim()
    .replace(/[\s-]+/g, ' ').replace(/ /g, '-').split('-').slice(0, 6).join('-')
}

function flattenProperties (properties) {
  for (const prop in properties) {
    if (Array.isArray(properties[prop]) && properties[prop].length === 1) {
      properties[prop] = properties[prop][0]
    }
  }
}

function sanitiseProperties (properties) {
  for (const prop in properties) {
    if (prop.startsWith('mp-') || prop === 'h') {
      delete properties[prop]
    }
  }
}

const formatPost = async function (properties) {
  properties.published = properties.published || new Date().toISOString()
  properties.slug = deriveSlug(properties)
  properties['post-type'] = derivePostType(properties)
  sanitiseProperties(properties)
  const post = {
    slug: properties.slug,
    'post-type': properties['post-type'],
    published: properties.published,
    properties
  }
  return post
}

exports.micropub = { formatPost, sanitiseProperties, isValidUrl }
