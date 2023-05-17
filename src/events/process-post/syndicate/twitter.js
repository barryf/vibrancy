const path = require('path')
const brevity = require('brevity')
const Twit = require('twit')
const logger = require('@architect/shared/logger')
const { generateContent, appendSpecialCategories } = require('./text-helpers')

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

function imageOptimise (url) {
  const height = 675
  const cloudinaryName = process.env.CLOUDINARY_CLOUD_NAME
  const starts = `https://res.cloudinary.com/${cloudinaryName}/image/upload/`
  if (url.startsWith(starts)) {
    return url.replace(starts, `${starts}h_${height},fl_progressive/`)
  } else {
    return url
  }
}

async function postStatus (status) {
  const { data } = await twit.post('statuses/update', status)
  const tweetUrl = 'https://twitter.com/' + data.user.screen_name + '/status/' +
    data.id_str
  return tweetUrl
}

function generateStatus (post, mediaIds = []) {
  const absoluteUrl = new URL(post.url, process.env.ROOT_URL).href

  let content = generateContent(post)
  content += appendSpecialCategories(post)

  const status = {
    status: content
  }

  // add media
  if (Array.isArray(mediaIds) && mediaIds.length) {
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
      absoluteUrl,
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
  const response = await fetch(image)
  const buffer = await response.buffer()
  image = Buffer.from(buffer).toString('base64')
  const media = await twit.post('media/upload', { media: image })
  return media.data.media_id_string
}

async function sendTweet (post) {
  const mediaIds = []
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
    if (post.properties.photo) {
      // trim to 4 photos as twitter doesn't support more
      const photos = post.properties.photo.slice(0, 4)
      for (const p of photos) {
        let photo
        if (p.value) {
          photo = imageOptimise(p.value)
        } else if (p.buffer) {
          photo = p.buffer
        } else {
          photo = imageOptimise(p)
        }
        const mediaId = await mediaUpload(photo)
        mediaIds.push(mediaId)
      }
    }
    const status = generateStatus(post, mediaIds)
    if (status) {
      return await postStatus(status)
    }
  }
  logger.error('Unknown error posting to Twitter')
}

async function syndicate (post) {
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
}

module.exports = { syndicate }
