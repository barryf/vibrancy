const twitter = require('./twitter')
const mastodon = require('./mastodon')
const pinboard = require('./pinboard')
const logger = require('@architect/shared/logger')

async function syndicate (post, syndicateTo) {
  if (!('syndication' in post.properties)) {
    post.properties.syndication = []
  }

  // iterate over each syndicateTo url
  for (const syndication of syndicateTo) {
    let url
    // break if a syndication already exists for this target
    if (post.properties.syndication.includes(syndication)) {
      logger.warn('Syndication already exists', syndication)
      break
    }
    // ok to syndicate
    if (syndication.indexOf('https://twitter.com') > -1) {
      url = await twitter.syndicate(post)
      if (url) logger.info(`Syndicated to Twitter ${url}`)
    } else if (syndication.indexOf('https://mastodon') > -1) {
      url = await mastodon.syndicate(post)
      if (url) logger.info(`Syndicated to Mastodon ${url}`)
    } else if (syndication.indexOf('https://pinboard.in') > -1) {
      await pinboard.syndicate(post)
      logger.info('Syndicated to Pinboard')
      // no return value :(
    }
    if (url) post.properties.syndication.push(url)
  }

  // remove syndication key if it's an empty array
  if (post.properties.syndication.length === 0) {
    delete post.properties.syndication
  }
}

module.exports = syndicate
