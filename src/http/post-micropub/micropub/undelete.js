const arc = require('@architect/functions')

async function undelete (properties) {
  const data = await arc.tables()

  const url = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ url })

  delete post.properties.deleted
  delete post.deleted
  post.properties.updated = [new Date().toISOString()]

  return {
    post,
    statusCode: 204
  }
}

module.exports = undelete
