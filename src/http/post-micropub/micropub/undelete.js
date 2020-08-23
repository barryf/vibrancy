const arc = require('@architect/functions')

async function undelete (properties) {
  const data = await arc.tables()

  const url = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ url })

  delete post.deleted
  post.updated = new Date().toISOString()

  return {
    post,
    statusCode: 204
  }
}

exports.undelete = undelete
