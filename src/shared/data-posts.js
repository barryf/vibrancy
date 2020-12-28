const arc = require('@architect/functions')

// remove public post if no longer public (not visible, a draft or deleted)
async function putPostsPublic (post) {
  const data = await arc.tables()
  if (
    ('visibility' in post.properties && post.properties.visibility[0] !== 'public') ||
    ('post-status' in post.properties && post.properties['post-status'][0] === 'draft') ||
    ('deleted' in post.properties)
  ) {
    await data['posts-public'].delete({ url: post.url })
  } else {
    await data['posts-public'].put(post)
  }
}

async function put (post) {
  const data = await arc.tables()
  await data.posts.put(post)
  await putPostsPublic(post)
}

module.exports = { put }
