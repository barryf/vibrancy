const arc = require('@architect/functions')
const { micropub } = require('./micropub')
const { github } = require('./github')

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)

  // console.log(`body=${JSON.stringify(body)}`)

  // if ("Authorization" in req.headers) {

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
    const post = await micropub.formatPost(body.properties)
    const response = github.createFile(post)
    if (response.status === 201) {
      const data = await arc.tables()
      await data.posts.put({
        ...post,
        sha: response.body.commit.sha
      })
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
