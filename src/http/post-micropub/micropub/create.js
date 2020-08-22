const arc = require('@architect/functions')
const { utils } = require('@architect/shared/utils')
const github = require('../github')

function deriveUrl (post) {
  let slug = ''
  // if the request passed mp-slug, make sure it's in the right format
  if ('mp-slug' in post && post['mp-slug'] !== '' &&
    post['mp-slug'].match(/^[a-z0-9][a-z0-9/-]*$/)) {
    // if we have a leading slash then this is a top-level page
    if (post['mp-slug'].substr(0, 1) === '/') {
      return post['mp-slug'].substr(1, post['mp-slug'].length - 1)
    } else {
      slug = post['mp-slug']
    }
  }
  // convert published string to a date object and construct yyyy/mm prefix
  const published = new Date(post.published)
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

function formatPost (body) {
  let post, syndicateTo
  if ('properties' in body) {
    post = { ...body.properties }
    utils.flattenJSON(post)
  } else {
    post = { ...body }
    utils.flattenFormEncoded(post)
  }
  if ('mp-syndicate-to' in post) {
    syndicateTo = Array.isArray(post['mp-syndicate-to'])
      ? post['mp-syndicate-to']
      : [post['mp-syndicate-to']]
  }
  post.type = 'h-entry'
  post.published = post.published || new Date().toISOString()
  post.url = deriveUrl(post)
  post['post-type'] = utils.derivePostType(post)
  utils.sanitise(post)
  return { post, syndicateTo }
}

async function create (scope, body) {
  const data = await arc.tables()
  const { post, syndicateTo } = formatPost(body)
  if (scope === 'draft') {
    post['post-status'] = 'draft'
  }

  const findPost = await data.posts.get({ url: post.url })
  if (findPost !== undefined || utils.reservedUrls.includes(post.url)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'invalid_parameter',
        error_description: 'A post with this URL already exists'
      })
    }
  }

  const response = await github.createFile(post)
  if (response.statusCode !== 201) return response

  // add post to ddb
  await data.posts.put(post)
  // queue category caching
  await arc.queues.publish({
    name: 'update-categories',
    payload: { url: post.url }
  })
  // syndicate if requested
  if (syndicateTo) {
    await arc.queues.publish({
      name: 'syndicate',
      payload: {
        url: post.url,
        syndicateTo
      }
    })
  }

  return {
    statusCode: 201,
    headers: {
      location: process.env.ROOT_URL + post.url
    }
  }
}

exports.create = create
