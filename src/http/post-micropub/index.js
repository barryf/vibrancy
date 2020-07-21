const arc = require('@architect/functions')
const { micropub } = require('./micropub')
const { github } = require('./github')
const { auth } = require('@architect/shared/auth')

exports.handler = async function http (req) {
  const data = await arc.tables()
  const body = arc.http.helpers.bodyParser(req)
  console.log(`body=${JSON.stringify(body)}`)

  const authResponse = await auth.requireAuth(req.headers, body)
  // console.log(`authResponse=${JSON.stringify(authResponse)}`)
  if (authResponse !== true) return authResponse

  if ('action' in body) {
    if (!['create', 'update', 'delete', 'undelete'].includes(body.action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'not_supported',
          error_description: 'The specified action is not supported'
        })
      }
    }
    if (!micropub.isValidUrl(body.url)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'invalid_parameter',
          error_description: 'The specified URL is not a valid URL'
        })
      }
    }
    // const post = await micropub.action(body)
    // const method = body.action === 'create' ? 'added' : 'modified'
    // await queueUpload(post.slug, method)
    // return send201(`${process.env.ROOT_URL}${post.slug}`)
  } else if ('file' in body) {
    // assume this is a file (photo) upload
    // const url = await media.save(body.file)
    // return send201(url)
  } else {
    // assume this is a create
    const post = await micropub.formatPost(body)
    // does post already exist? reject if so
    const findPost = await data.posts.get({ slug: post.slug })
    if (findPost !== undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'invalid_parameter',
          error_description: 'A post with this slug already exists'
        })
      }
    }
    // console.log(JSON.stringify(post))
    const response = await github.createFile(post)
    // console.log(JSON.stringify(response))
    if (response.status === 201) {
      await data.posts.put(post)
      // console.log(JSON.stringify(post))
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
