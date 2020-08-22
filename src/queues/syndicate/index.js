const arc = require('@architect/functions')
const twitter = require('./twitter')

exports.handler = async function queue (event) {
  const data = await arc.tables()
  const body = JSON.parse(event.Records[0].body)
  const url = body.url
  // console.log('syn', body)

  if (body.syndicateTo && Array.isArray(body.syndicateTo)) {
    const post = await data.posts.get({ url })
    if (!('syndication' in post)) { post.syndication = [] }
    // iterate over each syndicateTo url
    body.syndicateTo.forEach(async syndicateTo => {
      if (syndicateTo.indexOf('twitter.com') > -1) {
        const tweetUrl = await twitter.syndicate(post)
        if (tweetUrl) {
          post.syndication.push(tweetUrl)
        }
      }
    })
    await data.posts.put(post)
  }
}
