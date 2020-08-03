const arc = require('@architect/functions')
const { auth } = require('@architect/shared/auth')
const { utils } = require('@architect/shared/utils')
const { query } = require('./query')
const { config } = require('./config')

async function setWebmentions (post) {
  const absoluteUrl = process.env.ROOT_URL + post.url
  const webmentionsData = await query.findWebmentions(absoluteUrl)
  if (webmentionsData.Count > 0) {
    const webmentionProperties = {
      'in-reply-to': 'comment',
      'like-of': 'like',
      'repost-of': 'repost',
      rsvp: 'rsvp',
      'bookmark-of': 'bookmark'
    }
    webmentionsData.Items.forEach(webmention => {
      for (const prop in webmentionProperties) {
        if (webmention.post['wm-property'] === prop) {
          post[webmentionProperties[prop]] =
            post[webmentionProperties[prop]] || []
          post[webmentionProperties[prop]].push(webmention.post)
        }
      }
    })
  }
}

async function getPost (params) {
  const url = params.url.replace(process.env.ROOT_URL, '')
  const postData = await query.getPost(url)
  if (postData === undefined) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'not_found',
        error_description: 'Post was not found'
      })
    }
  }
  const post = { ...postData }
  utils.unflatten(post)
  setWebmentions(post)
  return {
    body: JSON.stringify({
      type: ['h-entry'],
      properties: post
    })
  }
}

async function findPostItems (params, scope) {
  const postData = await query.findPostItems(params, scope)
  const items = postData.Items.map(post => {
    post.url = `${process.env.ROOT_URL}${post.url}`
    utils.unflatten(post)
    return {
      type: ['h-entry'],
      properties: post
    }
  })
  return {
    body: JSON.stringify({ items })
  }
}

async function source (params, scope) {
  if ('url' in params) {
    if (!utils.isValidURL(params.url)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'invalid_parameter',
          error_description: 'URL parameter is invalid'
        })
      }
    }
    return getPost(params)
  }
  return findPostItems(params, scope)
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)
  const authResponse = await auth.requireScope('read', req.headers, body)
  // if (authResponse.statusCode !== 200) return authResponse

  const params = req.queryStringParameters || {}
  if ('q' in params) {
    switch (params.q) {
      case 'category':
        return { body: JSON.stringify(await config.category(params.filter)) }
      case 'config':
        return { body: JSON.stringify(config.config) }
      case 'syndicate-to':
        return {
          body: JSON.stringify({
            'syndicate-to': config.syndicateTo(params['post-type'])
          })
        }
      case 'source':
        return await source(params, authResponse.scope)
    }
  }
  return {
    headers: { 'content-type': 'text/html; charset=utf8' },
    body: 'Micropub endpoint'
  }
}
