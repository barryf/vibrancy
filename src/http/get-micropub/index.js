const arc = require('@architect/functions')
const { auth } = require('@architect/shared/auth')

const isValidUrl = function (string) {
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
  if (!isValidUrl(query.url)) {
    // TODO: return statuscode error
    return { statusCode: 400, body: JSON.stringify({ message: 'URL is invalid' }) }
  }
  const slug = query.url.replace(process.env.ROOT_URL, '')
  console.log(`slug=${slug}`)
  const data = await arc.tables()
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
  const body = arc.http.helpers.bodyParser(req)

  const authResponse = await auth.requireAuth(body, req.headers)
  console.log(`authResponse=${JSON.stringify(authResponse)}`)
  if (authResponse !== true) return authResponse

  const query = req.queryStringParameters
  if ('q' in query) {
    switch (query.q) {
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
