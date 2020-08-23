const arc = require('@architect/functions')

// require syndicators
const twitter = require('./twitter')

exports.handler = async function queue (event) {
  const data = await arc.tables()
  const body = JSON.parse(event.Records[0].body)

  if (body.syndicateTo && Array.isArray(body.syndicateTo)) {
    const post = await data.posts.get({ url: body.url })
    if (!('syndication' in post)) { post.syndication = [] }
    // iterate over each syndicateTo url
    for (const syndicateTo of body.syndicateTo) {
      if (syndicateTo.indexOf('twitter.com') > -1) {
        const tweetUrl = await twitter.syndicate(post)
        post.syndication.push(tweetUrl)
      }
    }
    await data.posts.put(post)

    await arc.queues.publish({
      name: 'write-github',
      payload: {
        url: post.url,
        method: 'update'
      }
    })
  }
}
