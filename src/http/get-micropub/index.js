const arc = require('@architect/functions')
const { auth } = require('@architect/shared/auth')
const { utils } = require('@architect/shared/utils')
const { config } = require('./config')
const { query } = require('./query')
const { webmentions } = require('./webmentions')

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
  const type = post.type
  delete post.type
  if ('deleted' in post) {
    return {
      statusCode: 410,
      body: JSON.stringify({
        error: 'gone',
        error_description: 'This post is no longer available.',
        type,
        properties: { deleted: post.deleted }
      })
    }
  }
  webmentions.setWebmentions(post)
  return {
    body: JSON.stringify({
      type,
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
  if (!('url' in params)) return findPostItems(params, scope)
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

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)
  const authResponse = await auth.requireScope('read', req.headers, body)
  // if (process.env.NODE_ENV === 'production' &&
  //   authResponse.statusCode !== 200) return authResponse

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
    headers: { 'Content-Type': 'text/html; charset=utf8' },
    body: 'Micropub endpoint'
  }
}
