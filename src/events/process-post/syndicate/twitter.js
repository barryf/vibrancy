const path = require('path')
const fetch = require('node-fetch')
const brevity = require('brevity')
const Twit = require('twit')
const logger = require('@architect/shared/logger')

// adapted from @grantcodes' Postr's syndicator-twitter
// https://github.com/grantcodes/postr/blob/master/packages/syndicator-twitter/index.js

const tweetIdFromUrl = tweetUrl => {
  const parsedUrl = new URL(tweetUrl)
  const statusId = path.basename(parsedUrl.pathname)
  return statusId
}

const isTweetUrl = tweetUrl => {
  const parsedUrl = new URL(tweetUrl)
  return parsedUrl.hostname === 'twitter.com'
}

const twit = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

async function postStatus (status) {
  const { data } = await twit.post('statuses/update', status)
  const tweetUrl = 'https://twitter.com/' + data.user.screen_name + '/status/' +
    data.id_str
  return tweetUrl
}

function generateStatus (post, mediaIds = null) {
  const absoluteUrl = new URL(post.url, process.env.ROOT_URL).href
  let content = null
  if (post.properties.summary) {
    content = post.properties.summary[0] + ' ' + absoluteUrl
  } else if (post.properties.name) {
    content = post.properties.name[0] + ' ' + absoluteUrl
  } else if (post.properties.content &&
    typeof post.properties.content[0] === 'string') {
    content = post.properties.content[0]
  } else if (post.properties['repost-of']) {
    content = post.properties['repost-of'][0]
  }

  const status = {
    status: content
  }

  // add media
  if (mediaIds) {
    status.media_ids = mediaIds.join(',')
  }

  // add in-reply-to if appropriate
  if (post.properties['in-reply-to']) {
    let replyTo
    for (const r of post.properties['in-reply-to']) {
      if (r.indexOf('twitter.com') > -1) {
        replyTo = r
        break
      }
    }
    if (replyTo) {
      const parsedUrl = new URL(replyTo)
      const statusId = tweetIdFromUrl(replyTo)
      status.in_reply_to_status_id = statusId
      const username = '@' + parsedUrl.pathname.split('/')[1]
      if (status.status && status.status.indexOf(username) === -1) {
        status.status = username + ' ' + status.status
      }
    }
  }

  // add location
  if (post.properties.location) {
    let geouri = post.properties.location[0]
    if (typeof geouri === 'string') {
      if (geouri.indexOf(';u') > -1) {
        geouri = geouri.substring(0, geouri.indexOf(';'))
      }
      if (geouri.indexOf('geo:') === 0) {
        geouri = geouri.substr(4, geouri.length - 4)
      }
      const coords = geouri.split(',')
      status.lat = coords[0]
      status.long = coords[1]
    } else if (
      geouri.properties &&
      geouri.properties.latitude &&
      geouri.properties.longitude
    ) {
      status.lat = geouri.properties.latitude[0]
      status.long = geouri.properties.longitude[0]
    }
  }

  if (status.status) {
    status.status = brevity.shorten(
      status.status,
      post.url,
      false,
      false,
      280
    )
  } else {
    logger.error('Error generating Twitter status', JSON.stringify(status, null, 2))
  }

  return status
}

async function mediaUpload (image) {
  if (typeof image === 'string') {
    const res = await fetch(image)
    image = Buffer.from(res.body.arrayBuffer())
  }
  if (image instanceof Buffer) {
    const media = await twit.post('media/upload', { media: image })
    return media.media_id_string
  }
  throw new Error('Error posting image to Twitter')
}

async function sendTweet (post) {
  // if it is a repost then first check if it is a retweet
  if (post.properties['repost-of'] && isTweetUrl(post['repost-of'][0])) {
    const statusId = tweetIdFromUrl(post.properties['repost-of'][0])
    const { data } = twit.post('statuses/retweet/' + statusId, {})
    const repostUrl = `https://twitter.com/${
      data.user.screen_name
    }/status/${data.id_str}#favorited-by-${process.env.TWITTER_ACCOUNT}`
    return repostUrl
  } else if (post.properties['like-of'] &&
    isTweetUrl(post.properties['like-of'][0])) {
    // check if it is a like of a tweet then sydicate the like
    const statusId = tweetIdFromUrl(post.properties['like-of'][0])
    const { data } = twit.post('favorites/create', {
      id: statusId
    })
    const likeUrl = `https://twitter.com/${
      data.user.screen_name
    }/status/${data.id_str}`
    return likeUrl
  } else {
    // check for photos
    let mediaIds = []
    let status = null
    if (post.properties.photo) {
      // trim to 4 photos as twitter doesn't support more
      const photos = post.properties.photo.slice(0, 4)
      for (let photo of photos) {
        if (photo.value) {
          photo = photo.value
        }
        if (photo.buffer) {
          photo = photo.buffer
        }
        mediaIds.push(await mediaUpload(photo))
      }
    }
    mediaIds = mediaIds.length ? mediaIds : false
    status = generateStatus(post)
    if (status) {
      return await postStatus(status)
    }
  }
  logger.error('Unknown error posting to Twitter')
  return false
}

async function syndicate (post) {
  try {
    // if there is an existing syndication to twitter do not syndicate this post
    if (post.properties.syndication.find(tweet => isTweetUrl(tweet))) {
      // there is already a twitter syndication for this post so skip it
      return null
    } else if (
      (post.properties['like-of'] &&
        !isTweetUrl(post.properties['like-of'][0])) ||
      (post.properties['in-reply-to'] &&
        !isTweetUrl(post.properties['in-reply-to'][0]))
    ) {
      // don't post likes and replies of external urls
      return null
    } else {
      const tweetUrl = await sendTweet(post)
      return tweetUrl
    }
  } catch (err) {
    logger.error('Error syndicating to Twitter', JSON.stringify(err, null, 2))
  }
  return null
}

module.exports = { syndicate }
