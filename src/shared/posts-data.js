const arc = require('@architect/functions')

async function put (post) {
  const data = await arc.tables()

  await data.posts.put(post)

  await arc.queues.publish({
    name: 'update-categories',
    payload: { url: post.url }
  })
}

exports.postsData = { put }
