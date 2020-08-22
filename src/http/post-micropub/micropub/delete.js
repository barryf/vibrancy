const arc = require('@architect/functions')
const github = require('../github')

async function deletePost (properties) {
  const data = await arc.tables()

  const url = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ url })

  post.deleted = new Date().toISOString()
  post.updated = post.deleted

  const response = await github.deleteFile(post)
  if (response.statusCode !== 204) return response

  // update post in ddb
  await data.posts.put(post)
  // queue category caching
  await arc.queues.publish({
    name: 'update-categories',
    payload: { url: post.url }
  })

  return {
    statusCode: 204
  }
}

exports.deletePost = deletePost
