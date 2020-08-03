const arc = require('@architect/functions')
const { utils } = require('@architect/shared/utils')
// const github = require('../github')

function derivePostType (post) {
  if (('rsvp' in post) &&
    ['yes', 'no', 'maybe', 'interested'].includes(post.rsvp)) {
    return 'rsvp'
  } else if (('in-reply-to' in post) &&
    utils.isValidURL(post['in-reply-to'])) {
    return 'in-reply-to'
  } else if (('repost-of' in post) &&
    utils.isValidURL(post['repost-of'])) {
    return 'repost-of'
  } else if (('like-of' in post) &&
    utils.isValidURL(post['like-of'])) {
    return 'like-of'
  } else if (('video' in post) &&
    utils.isValidURL(post.video)) {
    return 'video'
  } else if (('photo' in post) &&
    utils.isValidURL(post.photo)) {
    return 'photo'
  } else if (('bookmark-of' in post) &&
    utils.isValidURL(post['bookmark-of'])) {
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
  if (slug.length === 0) {
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
  let post
  if ('properties' in body) {
    post = { ...body.properties }
    utils.flatten(post)
  } else {
    post = { ...body }
  }
  post.type = 'h-entry'
  post.published = post.published || new Date().toISOString()
  post.url = deriveUrl(post)
  post['post-type'] = derivePostType(post)
  utils.sanitise(post)
  return post
}

async function create (scope, body) {
  const data = await arc.tables()
  const post = formatPost(body)
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

  // TODO remove shim
  // const gitHubResponse = await github.createFile(post)
  const gitHubResponse = { status: 201 }
  if (gitHubResponse.status === 201) {
    await data.posts.put(post)
    return {
      statusCode: 201,
      headers: {
        location: process.env.ROOT_URL + post.url
      }
    }
  } else {
    return {
      statusCode: 500,
      body: 'Error from GitHub when creating post.'
      // TODO: better error
    }
  }
}

exports.create = create
