// const arc = require('@architect/functions')
const {
  derivePostType,
  sanitise,
  reservedUrls
} = require('@architect/shared/utils')

function deriveUrl (post) {
  let slug = ''
  // if the request passed mp-slug, make sure it's in the right format
  if ('mp-slug' in post.properties &&
    post.properties['mp-slug'][0] !== '' &&
    post.properties['mp-slug'][0].match(/^\/?[a-z0-9][a-z0-9/-]*$/)) {
    // if we have a leading slash then this is a top-level page
    if (post.properties['mp-slug'][0].substr(0, 1) === '/') {
      return post.properties['mp-slug'][0].substr(1,
        post.properties['mp-slug'][0].length - 1)
    } else {
      slug = post.properties['mp-slug'][0]
    }
  }
  // convert published string to a date object and construct yyyy/mm prefix
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
  let post, syndicateTo
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
  if ('mp-channel' in post.properties) {
    post.channel = post.properties['mp-channel']
  } else {
    post.channel = 'posts'
  }
  if ('mp-syndicate-to' in post.properties) {
    syndicateTo = post.properties['mp-syndicate-to']
  }
  post.properties.published = [('published' in post.properties)
    ? post.properties.published[0]
    : new Date().toISOString()]
  post.published = post.properties.published[0]
  // console.log('formatPost post', JSON.stringify(post, null, 2))
  post.url = deriveUrl(post)
  post['post-type'] = derivePostType(post)
  sanitise(post)
  return { post, syndicateTo }
}

async function create (scope, body) {
  // const data = await arc.tables()
  const { post, syndicateTo } = formatPost(body)
  if (scope === 'draft') {
    post['post-status'] = 'draft'
  }

  // TODO: uncomment this to prevent overwriting posts
  // const findPost = await data.posts.get({ url: post.url })
  // if (findPost !== undefined || reservedUrls.includes(post.url)) {
  //   return {
  //     statusCode: 400,
  //     body: JSON.stringify({
  //       error: 'invalid_parameter',
  //       error_description: 'A post with this URL already exists'
  //     })
  //   }
  // }

  return {
    post,
    syndicateTo,
    statusCode: 201,
    headers: {
      location: process.env.ROOT_URL + post.url
    }
  }
}

module.exports = create
