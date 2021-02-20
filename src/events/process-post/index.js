const arc = require('@architect/functions')
const dataPosts = require('@architect/shared/data-posts')
const { findContexts } = require('@architect/shared/utils')
const syndicate = require('./syndicate')
const updateCategories = require('./update-categories')

exports.handler = async function subscribe (event) {
  const data = await arc.tables()
  const body = JSON.parse(event.Records[0].Sns.Message)
  const url = body.url
  const syndicateTo = body.syndicateTo
  const scope = body.scope

  const post = await data.posts.get({ url })

  // loop over categories, adding/removing as appropriate
  await updateCategories(post)

  // syndicate if requested
  if (syndicateTo) {
    await syndicate(post, syndicateTo)
    // update posts and posts-public with syndications
    await dataPosts.put(post)
  }

  // fire webmentions asynchronously
  await arc.events.publish({
    name: 'send-webmentions',
    payload: { url }
  })

  // write to github
  await arc.events.publish({
    name: 'write-github',
    payload: {
      folder: post.channel,
      url,
      method: scope
    }
  })

  // fetch any contexts from the post
  for (const contextUrl of findContexts(post)) {
    await arc.events.publish({
      name: 'fetch-context',
      payload: { url: contextUrl }
    })
  }

  // notify me, but this doesn't mean above async tasks were successful
  await arc.events.publish({
    name: 'notify-push',
    payload: {
      url: process.env.ROOT_URL + url,
      message: (('updated' in post.properties) ? 'Updated' : 'Created') +
        ` ${post['post-type']}`
    }
  })
}
