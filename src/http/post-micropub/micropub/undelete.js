const arc = require('@architect/functions')
const { postsData } = require('@architect/shared/post-data')

async function undelete (properties) {
  const data = await arc.tables()

  const url = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ url })

  delete post.deleted
  post.updated = new Date().toISOString()

  // TODO send to github - decide async or sync
  await postsData.put(post)

  return {
    statusCode: 204
  }
}

exports.undelete = undelete
