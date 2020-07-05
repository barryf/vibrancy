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
    ['yes', 'no', 'maybe', 'interested'].includes(properties.rsvp)) {
    return 'rsvp'
  } else if (('in-reply-to' in properties) &&
    isValidUrl(properties['in-reply-to'])) {
    return 'in-reply-to'
  } else if (('repost-of' in properties) &&
    isValidUrl(properties['repost-of'])) {
    return 'repost-of'
  } else if (('like-of' in properties) &&
    isValidUrl(properties['like-of'])) {
    return 'like-of'
  } else if (('video' in properties) &&
    isValidUrl(properties.video)) {
    return 'video'
  } else if (('photo' in properties) &&
    isValidUrl(properties.photo)) {
    return 'photo'
  } else if (('bookmark-of' in properties) &&
    isValidUrl(properties['bookmark-of'])) {
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
  // if the request passed mp-slug, make sure it's in the right format
  if ('mp-slug' in properties && properties['mp-slug'] !== '' &&
    properties['mp-slug'].match(/^[a-z0-9][a-z0-9/-]*$/)) {
    return properties['mp-slug']
  }
  // convert published string to a date object and construct yyyy/mm prefix
  const published = new Date(properties.published)
  const yyyy = published.getFullYear().toString()
  const m = (published.getMonth() + 1).toString()
  const mm = m.length === 1 ? `0${m}` : m
  const prefix = `${yyyy}/${mm}/`
  // try to make a sensible slug from content/summary either in text or html
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
  // we don't have sensible text to use so create a random string of letters
  if (content === '') {
    return prefix + Math.random().toString(36).substring(2, 15)
  }
  // use first 6 words from content
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

const formatPost = async function (bodyProperties) {
  const properties = { ...bodyProperties }
  flattenProperties(properties)
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

exports.micropub = { formatPost, isValidUrl }
