const arc = require('@architect/functions')
const { syndicate } = require('./syndicate')
const { updateCategories } = require('./update-categories')

async function updatePostsPublic (post) {
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

exports.handler = async function subscribe (event) {
  const data = await arc.tables()
  const body = JSON.parse(event.Records[0].Sns.Message)
  const url = body.url
  const syndicateTo = body.syndicateTo
  const scope = body.scope

  const post = await data.posts.get({ url })

  // remove public post if no longer public (not visible, a draft or deleted)
  await updatePostsPublic(post)

  // loop over categories, adding/removing as appropriate
  await updateCategories(post)

  // syndicate if requested
  if (syndicateTo) {
    await syndicate(post, syndicateTo)
    // update post with syndications
    await data.posts.put(post)
  }

  // fire webmentions asynchronously via ruby
  await arc.events.publish({
    name: 'send-webmentions',
    payload: { url }
  })

  // finally write to github
  await arc.events.publish({
    name: 'write-github',
    payload: {
      folder: post.channel,
      url,
      method: scope
    }
  })
}
