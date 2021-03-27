const twitter = require('./twitter')
const pinboard = require('./pinboard')
const microBlog = require('./micro-blog')
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
      logger.info(`Syndicated to Twitter ${url}`)
    } else if (syndication.indexOf('https://pinboard.in') > -1) {
      await pinboard.syndicate(post)
      logger.info('Syndicated to Pinboard')
      // no return value :(
    } else if (syndication.indexOf('https://micro.blog') > -1) {
      url = await microBlog.syndicate(post)
      logger.info(`Syndicated to Micro.blog ${url}`)
    }
    if (url) post.syndication.push(url)
  }
}

module.exports = syndicate
