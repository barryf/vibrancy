const path = require('path')
const fetch = require('node-fetch')
const brevity = require('brevity')
const Twitter = require('twitter')

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

async function getClient () {
  const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  })
  return client
}

async function postStatus (status) {
  const client = await getClient()
  client.post('statuses/update', status, function (err, tweet, response) {
    if (err) throw err
    console.log('tweet', tweet)
    console.log('tw response', response)
    return 'foo'
  })
  // const tweetUrl = `https://twitter.com/${user.screen_name}/status/${idStr}`
  // return tweetUrl
}

function generateStatus (post, mediaIds = null) {
  let content = null
  if (post.summary) {
    content = post.summary + ' ' + post.url
  } else if (post.name) {
    content = post.name + ' ' + post.url
  } else if (post.content && typeof post.content === 'string') {
    content = post.content
  } else if (post['repost-of']) {
    content = post['repost-of']
  }

  const status = {
    status: content
  }

  // add media
  if (mediaIds) {
    status.media_ids = mediaIds.join(',')
  }

  // add in-reply-to if appropriate
  if (post['in-reply-to']) {
    const replyTo = post['in-reply-to']
    if (replyTo.indexOf('twitter.com') > -1) {
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
  if (post.location) {
    let geouri = post.location
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
    console.log('Error generating Twitter status', status, post)
  }

  return status
}

async function mediaUpload (image) {
  const client = await getClient()
  if (typeof image === 'string') {
    const res = await fetch(image)
    image = Buffer.from(res.body.arrayBuffer())
  }
  if (image instanceof Buffer) {
    const media = await client.post('media/upload', { media: image })
    return media.media_id_string
  }
  throw new Error('Error posting image to Twitter')
}

async function sendTweet (post) {
  const client = await getClient()
  // if it is a repost then first check if it is a retweet
  if (post['repost-of'] && isTweetUrl(post['repost-of'])) {
    const statusId = tweetIdFromUrl(post['repost-of'])
    const { user, idStr } = await client.post('statuses/retweet/' + statusId, {})
    const repostUrl = `https://twitter.com/${
      user.screen_name
    }/status/${idStr}#favorited-by-${this.options.handle}`
    return repostUrl
  } else if (post['like-of'] && isTweetUrl(post['like-of'])) {
    // check if it is a like of a tweet then sydicate the like
    const statusId = tweetIdFromUrl(post['like-of'])
    const { user, idStr } = await client.post('favorites/create', {
      id: statusId
    })
    const likeUrl = `https://twitter.com/${user.screen_name}/status/${idStr}`
    return likeUrl
  } else {
    // // check for photos
    // let mediaIds = []
    // let status = null
    // if (post.photo) {
    //   // trim to 4 photos as twitter doesn't support more
    //   const photos = post.photo.slice(0, 4)
    //   for (let photo of photos) {
    //     if (photo.value) {
    //       photo = photo.value
    //     }
    //     if (photo.buffer) {
    //       photo = photo.buffer
    //     }
    //     mediaIds.push(await mediaUpload(photo))
    //   }
    // }
    // mediaIds = mediaIds.length ? mediaIds : false
    const status = generateStatus(post)
    console.log('status', status)
    if (status) {
      return await postStatus(status)
    }
  }
  console.error('Unknown error posting to Twitter')
  return false
}

async function syndicate (post) {
  try {
    // if there is an existing syndication to twitter do not syndicate this post
    if (post.syndication.find(tweet => isTweetUrl(tweet))) {
      // there is already a twitter syndication for this post so skip it
      return null
    } else if (
      (post['like-of'] &&
        !isTweetUrl(post['like-of'])) ||
      (post['in-reply-to'] &&
        !isTweetUrl(post['in-reply-to']))
    ) {
      // don't post likes and replies of external urls
      return null
    } else {
      console.log('h')
      const tweetUrl = await sendTweet(post)
      console.log('tweetUrl', tweetUrl)
      return tweetUrl
    }
  } catch (err) {
    console.log('Error syndicating to Twitter', err)
  }
  return null
}

module.exports = { syndicate }
