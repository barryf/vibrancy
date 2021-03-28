const arc = require('@architect/functions')
const {
  derivePostType,
  reservedUrls
} = require('@architect/shared/utils')

function deriveUrl (post) {
  let slug = ''
  // if the request passed mp-slug, make sure it's in the right format
  if ('mp-slug' in post.properties &&
    post.properties['mp-slug'][0] !== '' &&
    post.properties['mp-slug'][0].match(/^\/?[a-z0-9][a-z0-9/-]*$/)) {
    // is this a page and we've got a slug - just use that
    if ('mp-channel' in post.properties &&
      !reservedUrls.includes(post.properties['mp-slug'][0]) &&
      post.properties['mp-channel'][0] === 'pages') {
      return post.properties['mp-slug'][0]
    } else {
      slug = post.properties['mp-slug'][0]
    }
  }
  const published = new Date(post.properties.published[0])
  const yyyy = published.getFullYear().toString()
  const m = (published.getMonth() + 1).toString()
  const mm = m.length === 1 ? `0${m}` : m
  const prefix = `${yyyy}/${mm}/`
  // if we have a slug passed in then use this with date prefix
  if (slug.length !== 0) {
    return prefix + slug
  }
  // try to make a sensible slug from content/summary either in text or html
  let content = ''
  if ('name' in post.properties) {
    content = post.properties.name[0]
  } else if ('summary' in post.properties &&
    Array.isArray(post.properties.summary)) {
    content = post.properties.summary[0]
  } else if ('content' in post.properties) {
    if (typeof post.properties.content[0] === 'object' &&
      'html' in post.properties.content[0]) {
      content = post.properties.content[0].html
    } else {
      content = post.properties.content[0]
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

function formatPost (body) {
  let post
  if ('properties' in body) {
    // json format
    post = { ...body }
  } else {
    // form-encoded format
    post = {
      type: ['h-' + body.h],
      properties: {}
    }
    for (const prop in body) {
      if (prop === 'content[html]') {
        post.properties.content = [{ html: body[prop] }]
      } else if (!Array.isArray(body[prop])) {
        post.properties[prop] = [body[prop]]
      } else {
        post.properties[prop] = body[prop]
      }
    }
  }
  post.properties.published = [('published' in post.properties)
    ? post.properties.published[0]
    : new Date().toISOString()]
  // store type as simple value
  post.type = post.type[0]
  post.url = deriveUrl(post)
  post['post-type'] = derivePostType(post)
  return post
}

async function create (scope, body) {
  const data = await arc.tables()
  const post = formatPost(body)

  // force posts to drafts if scope is draft
  if (scope === 'draft') {
    post.properties['post-status'] = ['draft']
    post['post-status'] = 'draft'
  }

  // TODO: uncomment this to prevent overwriting posts
  const findPost = await data.posts.get({ url: post.url })
  if (findPost !== undefined || reservedUrls.includes(post.url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'invalid_parameter',
        error_description: 'A post with this URL already exists'
      })
    }
  }

  return {
    post,
    statusCode: 201,
    headers: {
      location: process.env.ROOT_URL + post.url
    }
  }
}

module.exports = create
