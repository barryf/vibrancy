const arc = require('@architect/functions')

async function deletePost (properties) {
  const data = await arc.tables()

  const url = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ url })

  post.properties.deleted = [new Date().toISOString()]
  post.properties.updated = post.deleted

  return {
    post,
    statusCode: 204
  }
}

module.exports = deletePost
