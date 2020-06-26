const arc = require('@architect/functions')

const isValidUrl = function (string) {
  try {
    new URL(string) // eslint-disable-line
  } catch (_) {
    return false
  }
  return true
}

function deriveKind (properties) {
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

function sanitiseProperties (properties) {
  for (const prop in properties) {
    if (prop.startsWith('mp-')) {
      delete properties[prop]
    }
  }
}

const create = async function (body) {
  const data = await arc.tables()
  const slug = body.properties['mp-slug'][0]
  const kind = deriveKind(body.properties)
  const properties = {
    ...body.properties,
    slug: [slug],
    kind: [kind]
  }
  if (!('published' in properties)) {
    properties.published = Date.now
  }
  sanitiseProperties(properties)
  const post = {
    slug: slug,
    kind: kind,
    published: properties.published,
    properties: JSON.stringify(properties)
  }
  await data.posts.put(post)
  console.log(JSON.stringify(post))
  return post
}

exports.micropub = { create, isValidUrl }
