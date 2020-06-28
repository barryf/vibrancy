const arc = require('@architect/functions')
const { micropub } = require('./micropub')

async function queueUpload (slug) {
  await arc.queues.publish({ name: 'upload', payload: { slug } })
}

function send201 (url) {
  return {
    statusCode: 201,
    headers: {
      location: url
    }
  }
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)

  console.log(`req=${JSON.stringify(req)}`)

  console.log(`body=${JSON.stringify(body)}`)

  if (body === null) return { body: 'Missing' }

  // if ("Authorization" in req.headers) {

  if ('action' in body) {
    if (!['create', 'update', 'delete', 'undelete'].includes(body.action)) {
      return {
        statusCode: 500,
        body: `The specified action "${body.action}" is not supported.`
      }
    }
    // require_auth
    if (!micropub.isValidUrl(body.url)) {
      return {
        statusCode: 500,
        body: `The specified URL "${body.url} is not a valid URL.`
      }
    }
    const post = await micropub.action(body)
    queueUpload(post.slug)
    return send201(`${process.env.ROOT_URL}${post.slug}`)
  } else if ('file' in body) {
    // assume this is a file (photo) upload
    // require_auth
    // const url = await media.save(body.file)
    // return send201(url)
  } else {
    // assume this is a create
    // require_auth
    const post = await micropub.create(body)
    queueUpload(post.slug)
    return send201(process.env.ROOT_URL + post.slug)
  }
}
