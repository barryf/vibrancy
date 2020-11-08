const arc = require('@architect/functions')

exports.handler = async function subscribe (event) {
  const data = await arc.tables()
  const url = JSON.parse(event.Records[0].Sns.Message).url
  const post = await data.posts.get({ url })

  // remove public post if no longer public (not visible, a draft or deleted)
  if (
    ('visibility' in post.properties && post.properties.visibility[0] !== 'public') ||
    ('post-status' in post.properties && post.properties['post-status'][0] === 'draft') ||
    ('deleted' in post.properties)
  ) {
    await data['posts-public'].delete({ url })
  } else {
    await data['posts-public'].put(post)
  }
}
