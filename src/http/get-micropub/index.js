const arc = require('@architect/functions')
const { auth } = require('@architect/shared/auth')

function verifyUrl (url) {
  return true
}

function unflattenProperties (properties) {
  for (const prop in properties) {
    if (!Array.isArray(properties[prop])) {
      properties[prop] = [properties[prop]]
    }
  }
}

async function renderSource (query) {
  if (!verifyUrl(query.url)) {
    return { body: JSON.stringify({ message: 'URL is invalid' }) }
  }
  const slug = query.url.replace(process.env.ROOT_URL, '')
  const data = await arc.tables()
  const postData = await data.posts.get({ slug })
  if (postData === undefined) {
    return { body: JSON.stringify({ message: 'Post not found' }) }
  }
  const properties = { ...postData.properties }
  unflattenProperties(properties)
  return {
    body: JSON.stringify({
      type: ['h-entry'],
      properties
    })
  }
}

// TODO this is copy/pasted from post-micropub
async function requireAuth (body, headers) {
  let token = headers.Authorization ||
    (body && 'access_token' in body ? body.access_token : '')
  token = token.trim().replace(/^Bearer /, '')
  if (token === '') {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'unauthorized',
        message: 'Micropub endpoint did not return an access token.'
      })
    }
  }
  const scope = (body && 'action' in body) ? body.action : 'create'
  return await auth.verifyTokenAndScope(token, scope)
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)

  const authResponse = await requireAuth(body, req.headers)
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
