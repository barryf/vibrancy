const arc = require('@architect/functions')

async function deletePost (properties) {
  const data = await arc.tables()

  const url = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ url })

  post.deleted = new Date().toISOString()
  post.updated = post.deleted

  // TODO send to github - decide async or sync
  await data.posts.put(post)

  return {
    statusCode: 204
  }
}

exports.deletePost = deletePost
