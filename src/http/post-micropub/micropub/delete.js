const arc = require('@architect/functions')

async function deletePost (properties) {
  const data = await arc.tables()

  const url = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ url })

  const now = new Date().toISOString()
  post.properties.deleted = [now]
  post.properties.updated = [now]
  post.deleted = now

  return {
    post,
    statusCode: 204
  }
}

module.exports = deletePost
