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

async function renderSource (query) {
  const data = await arc.tables()
  if (!isValidUrl(query.url)) {
    if ('post-type' in query) {
      const postData = await data.posts.query({
        IndexName: 'post-type-published-index',
        Limit: 20,
        ScanIndexForward: false,
        KeyConditionExpression: '#postType = :postType',
        ExpressionAttributeNames: {
          '#postType': 'post-type'
        },
        ExpressionAttributeValues: {
          ':postType': query['post-type']
        }
      })
      return {
        body: JSON.stringify(postData.Items)
      }
    } else {
      // TODO: return statuscode error
      console.log('here')
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'URL is invalid' })
      }
    }
  }
  const slug = query.url.replace(process.env.ROOT_URL, '')
  console.log(`slug=${slug}`)
  const postData = await data.posts.get({ slug })
  console.log(`postData=${JSON.stringify(postData)}`)
  if (postData === undefined) {
    return { body: JSON.stringify({ message: 'Post not found' }) }
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
  if (authResponse !== true) return authResponse

  const query = req.queryStringParameters
  if ('q' in query) {
    switch (query.q) {
      case 'config':
        return { body: JSON.stringify(configQuery.config()) }
      case 'syndicate-to':
        return { body: JSON.stringify(configQuery.targets()) }
      case 'source':
        return await renderSource(query)
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
