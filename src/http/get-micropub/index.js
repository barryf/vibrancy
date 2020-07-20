const arc = require('@architect/functions')
const { auth } = require('@architect/shared/auth')
const { configQuery } = require('./config-query')

function isValidUrl (string) {
  try {
    new URL(string) // eslint-disable-line
  } catch (_) {
    return false
  }
  return true
}

function unflatten (post) {
  for (const key in post) {
    if (!Array.isArray(post[key])) {
      post[key] = [post[key]]
    }
  }
}

async function queryPostType (params, scope) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'post-type-published-index',
    Limit: 20,
    ScanIndexForward: false,
    KeyConditionExpression: '#postType = :postType',
    ExpressionAttributeNames: {
      '#postType': 'post-type'
    },
    ExpressionAttributeValues: {
      ':postType': params['post-type']
    }
  }
  if (scope === 'read') {
    opts.FilterExpression = '(visibility = :visibility ' +
      ' OR attribute_not_exists(visibility)' +
      ' ) AND (#postStatus = :postStatus' +
      ' OR attribute_not_exists(#postStatus))'
    opts.ExpressionAttributeNames['#postStatus'] = 'post-status'
    opts.ExpressionAttributeValues[':visibility'] = 'public'
    opts.ExpressionAttributeValues[':postStatus'] = 'published'
  }
  return await data.posts.query(opts)
}

async function queryPost (slug) {
  const data = await arc.tables()
  const postData = data.posts.get({ slug })
  if (!(postData === undefined ||
    ('visibility' in postData && postData.visibility === 'private'))) {
    return postData
  }
}

async function renderSource (query, scope) {
  if (!isValidUrl(query.url)) {
    if ('post-type' in query) {
      const postData = await queryPostType({
        'post-type': query['post-type']
      }, scope)
      const items = postData.Items.map(post => {
        unflatten(post)
        return {
          type: ['h-entry'],
          properties: post
        }
      })
      // console.log(JSON.stringify(items))
      return {
        body: JSON.stringify({ items })
      }
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'URL is invalid' })
      }
    }
  }
  const slug = query.url.replace(process.env.ROOT_URL, '')
  console.log(`slug=${slug}`)
  const postData = await queryPost(slug)
  console.log(`postData=${JSON.stringify(postData)}`)
  if (postData === undefined) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Post not found' })
    }
  }
  const post = { ...postData }
  unflatten(post)
  return {
    body: JSON.stringify({
      type: ['h-entry'],
      properties: post
    })
  }
}

exports.handler = async function http (req) {
  const authResponse = await auth.requireAuth(req.headers)
  console.log(`authResponse=${JSON.stringify(authResponse)}`)
  if (authResponse.statusCode !== 200) return authResponse

  const query = req.queryStringParameters
  if ('q' in query) {
    switch (query.q) {
      case 'config':
        return { body: JSON.stringify(configQuery.config()) }
      case 'syndicate-to':
        return { body: JSON.stringify(configQuery.targets()) }
      case 'source':
        return await renderSource(query, authResponse.scope)
    }
  }
  // if params.key?('q')
  //       require_auth
  //       content_type :json
  //       case params[:q]
  //       when 'source'
  //         render_source
  //       when 'config'
  //         render_config
  //       when 'syndicate-to'
  //         render_syndication_targets
  //       else
  //         # Silently fail if query method is not supported
  //       end
  //     else
  //       'Micropub endpoint'
  //     end
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: 'hello'
  }
}
