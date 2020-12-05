const arc = require('@architect/functions')

// require syndicators
const twitter = require('./twitter')
const pinboard = require('./pinboard')
const microBlog = require('./micro-blog')

async function addSyndications (post, syndicateTo) {
  if (!('syndication' in post.properties)) {
    post.properties.syndication = []
  }
  // iterate over each syndicateTo url
  for (const syndication of syndicateTo) {
    let url
    // break if a syndication already exists for this target
    if (post.properties.syndication.includes(syndication)) {
      console.log(`Syndication already exists for ${syndication}`)
      break
    }
    // ok to syndicate
    if (syndication.indexOf('https://twitter.com') > -1) {
      url = await twitter.syndicate(post)
    } else if (syndication.indexOf('https://pinboard.in') > -1) {
      await pinboard.syndicate(post)
      // no return value :(
    } else if (syndication.indexOf('https://micro.blog') > -1) {
      url = await microBlog.syndicate(post)
    }
    if (url) post.syndication.push(url)
  }
}

exports.handler = async function subscribe (event) {
  const data = await arc.tables()
  const body = JSON.parse(event.Records[0].Sns.Message)

  if (!body.syndicateTo) {
    console.log('No "syndicateTo" was included in event message.')
    return
  }

  if (!body.url) {
    console.log('No "url" was included in event message.')
  }

  const post = await data.posts.get({ url: body.url })

  await addSyndications(post, body.syndicateTo)

  // update post and posts-public
  await data.posts.put(post)

  await arc.events.publish({
    name: 'update-posts-public',
    payload: { url: post.url }
  })

  await arc.events.publish({
    name: 'write-github',
    payload: {
      folder: post.channel,
      url: post.url,
      method: 'update'
    }
  })
}
