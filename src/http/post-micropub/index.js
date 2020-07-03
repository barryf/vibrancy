const arc = require('@architect/functions')
const { micropub } = require('./micropub')
// const { github } = require('./github')
const { auth } = require('./auth')

async function requireAuth (body, headers) {
  let token = headers.HTTP_AUTHORIZATION || body.access_token || ''
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
  const scope = ('action' in body) ? body.action : 'post'
  return await auth.verifyTokenAndScope(token, scope)
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)

  const authResponse = requireAuth(body, req.headers)
  if ('error' in authResponse) {
    return {
      statusCode: authResponse.statusCode,
      body: JSON.stringify(authResponse)
    }
  }

  if ('action' in body) {
    if (!['create', 'update', 'delete', 'undelete'].includes(body.action)) {
      return {
        statusCode: 400,
        body: `The specified action "${body.action}" is not supported.`
      }
    }
    // require_auth
    if (!micropub.isValidUrl(body.url)) {
      return {
        statusCode: 400,
        body: `The specified URL "${body.url} is not a valid URL.`
      }
    }
    // const post = await micropub.action(body)
    // const method = body.action === 'create' ? 'added' : 'modified'
    // await queueUpload(post.slug, method)
    // return send201(`${process.env.ROOT_URL}${post.slug}`)
  } else if ('file' in body) {
    // assume this is a file (photo) upload
    // require_auth
    // const url = await media.save(body.file)
    // return send201(url)
  } else {
    // assume this is a create
    // require_auth
    const properties = { ...body }
    console.log(JSON.stringify(properties))
    micropub.sanitiseProperties(properties)
    console.log(JSON.stringify(properties))
    const post = await micropub.formatPost(properties)
    console.log(JSON.stringify(post))
    // const response = github.createFile(post)
    const response = { statusCode: 201 }
    if (response.statusCode === 201) {
      const data = await arc.tables()
      await data.posts.put(post)
      // console.log(JSON.stringify(post))
      // console.log(process.env.ROOT_URL + post.slug)
      return {
        statusCode: 201,
        headers: {
          location: process.env.ROOT_URL + post.slug
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
}
