const arc = require('@architect/functions')

// require syndicators
const twitter = require('./twitter')
const pinboard = require('./pinboard')
const microBlog = require('./micro-blog')

exports.handler = async function queue (event) {
  const data = await arc.tables()
  const body = JSON.parse(event.Records[0].body)

  if (body.syndicateTo) {
    const post = await data.posts.get({ url: body.url })
    if (!('syndication' in post.properties)) {
      post.properties.syndication = []
    }
    // iterate over each syndicateTo url
    for (const syndicateTo of body.syndicateTo) {
      let url
      if (syndicateTo.indexOf('twitter.com') > -1) {
        url = await twitter.syndicate(post)
      } else if (syndicateTo.indexOf('pinboard.in') > -1) {
        await pinboard.syndicate(post)
        // no return value :(
      } else if (syndicateTo.indexOf('micro.blog') > -1) {
        url = await microBlog.syndicate(post)
      }
      if (url) post.syndication.push(url)
    }
    await data.posts.put(post)

    await arc.queues.publish({
      name: 'write-github',
      payload: {
        folder: post.channel,
        url: post.url,
        method: 'update'
      }
    })
  }
}
