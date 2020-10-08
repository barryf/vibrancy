const arc = require('@architect/functions')
const auth = require('@architect/shared/auth')
const { jsonify, isValidURL } = require('@architect/shared/utils')
const config = require('./config')
const query = require('./query')
const { setWebmentions } = require('./webmentions')

async function getPost (params) {
  const url = params.url.replace(process.env.ROOT_URL, '')
  const postData = await query.getPost(url)
  if (postData === undefined) {
    return jsonify({
      error: 'not_found',
      error_description: 'Post was not found'
    }, 404)
  }
  const post = { ...postData }
  if ('deleted' in post.properties) {
    return jsonify({
      error: 'gone',
      error_description: 'This post is no longer available.',
      type: 'entry',
      properties: { deleted: post.properties.deleted[0] }
    }, 410)
  }
  await setWebmentions(post)
  return {
    type: ['h-entry'],
    'post-type': [post['post-type']],
    properties: post.properties
  }
}

async function findPostItems (params, scopes) {
  if (!('channel' in params)) params.channel = 'posts' // default channel
  const postData = await query.findPostItems(params, scopes)
  const items = postData.Items.map(post => {
    post.url = `${process.env.ROOT_URL}${post.url}`
    return {
      url: [post.url],
      type: ['h-entry'],
      'post-type': [post['post-type']],
      properties: post.properties
    }
  })
  return { items }
}

async function source (params, scopes) {
  if (!('url' in params)) return findPostItems(params, scopes)
  if (!isValidURL(params.url)) {
    return jsonify({
      error: 'invalid_parameter',
      error_description: 'URL parameter is invalid'
    }, 400)
  }
  return getPost(params)
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)
  const acceptedScopes = ['read', 'create']
  const authResponse = await auth.requireScopes(acceptedScopes, req.headers,
    body)
  if (process.env.NODE_ENV === 'production' &&
    authResponse.statusCode !== 200) return authResponse

  const params = req.queryStringParameters || {}
  if ('q' in params) {
    switch (params.q) {
      case 'category':
        return await config.category(params.filter)
      case 'config':
        return config.config
      case 'syndicate-to':
        return { 'syndicate-to': config.syndicateTo(params['post-type']) }
      case 'channel':
        return { channels: config.channels }
      case 'source':
        return await source(params, authResponse.scopes)
    }
  }
  return {
    statusCode: 200,
    'Content-Type': 'text/plain; charset=utf-8',
    body: 'Micropub endpoint'
  }
}
