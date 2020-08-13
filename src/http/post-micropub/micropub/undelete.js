const arc = require('@architect/functions')
const { postsData } = require('@architect/shared/posts-data')
const github = require('../github')

async function undelete (properties) {
  const data = await arc.tables()

  const url = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ url })

  delete post.deleted
  post.updated = new Date().toISOString()

  const response = await github.undeleteFile(post)
  if (response.statusCode !== 204) return response

  await postsData.put(post)
  return {
    statusCode: 204
  }
}

exports.undelete = undelete
