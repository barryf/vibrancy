const arc = require('@architect/functions')

async function undelete (properties) {
  const data = await arc.tables()

  const slug = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ slug })

  delete post.deleted
  post.updated = new Date().toISOString()

  // TODO send to github - decide async or sync
  await data.posts.put(post)

  return {
    statusCode: 204
  }
}

exports.undelete = undelete
