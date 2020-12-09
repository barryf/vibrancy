const twitter = require('./twitter')
const pinboard = require('./pinboard')
const microBlog = require('./micro-blog')

async function syndicate (post, syndicateTo) {
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

module.exports = { syndicate }
