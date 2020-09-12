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
  if ('deleted' in post.properties) {
    return {
      statusCode: 410,
      body: JSON.stringify({
        error: 'gone',
        error_description: 'This post is no longer available.',
        type: 'entry',
        properties: { deleted: post.properties.deleted[0] }
      })
    }
  }
  webmentions.setWebmentions(post)
  return {
    body: JSON.stringify({
      type: ['h-entry'],
      'post-type': [post['post-type']],
      properties: post.properties
    })
  }
}

async function findPostItems (params, scope) {
  if (!('channel' in params)) params.channel = 'posts' // default channel
  const postData = await query.findPostItems(params, scope)
  const items = postData.Items.map(post => {
    post.url = `${process.env.ROOT_URL}${post.url}`
    return {
      url: [post.url],
      type: ['h-entry'],
      'post-type': [post['post-type']],
      properties: post.properties
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
    headers: { 'Content-Type': 'text/plain; charset=utf8' },
    body: 'Micropub endpoint'
  }
}
