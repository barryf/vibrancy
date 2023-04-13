const arc = require('@architect/functions')

// remove public post if no longer public (not visible, a draft or deleted)
async function putPostsPublic (post) {
  const data = await arc.tables()
  if (
    ('visibility' in post.properties && post.properties.visibility[0] !== 'public') ||
    ('post-status' in post.properties && post.properties['post-status'][0] === 'draft') ||
    ('deleted' in post.properties) ||
    (post.channel !== 'posts')
  ) {
    await data['posts-public'].delete({ url: post.url })
  } else {
    await data['posts-public'].put(post)
  }
}

// set flag for posts that are suitable for the homepage (or rss feed).
// we want selected post-types and items in the 'posts' channel.
// this is only set in the public-posts table because only public are shown
function setHomepageFlag (post) {
  const postTypes = ['article', 'note', 'photo']
  post.homepage = postTypes.includes(post['post-type']) ? 1 : 0
  // weeknotes can be excluded because there's a dedicated section for them
  if (post.properties.category.includes('weeknotes')) post.homepage = 0
}

async function put (post) {
  const data = await arc.tables()
  await data.posts.put(post)
  setHomepageFlag(post)
  await putPostsPublic(post)
}

module.exports = { put }
