const { query } = require('./query')

async function setWebmentions (post) {
  const absoluteUrl = process.env.ROOT_URL + post.url
  const webmentionsData = await query.findWebmentions(absoluteUrl)
  if (webmentionsData.Count > 0) {
    const webmentionProperties = {
      'in-reply-to': 'comment',
      'like-of': 'like',
      'repost-of': 'repost',
      rsvp: 'rsvp',
      'bookmark-of': 'bookmark'
    }
    webmentionsData.Items.forEach(webmention => {
      for (const prop in webmentionProperties) {
        if (webmention.post['wm-property'] === prop) {
          post[webmentionProperties[prop]] =
            post[webmentionProperties[prop]] || []
          post[webmentionProperties[prop]].push(webmention.post)
        }
      }
    })
  }
}

module.exports.webmentions = {
  setWebmentions
}
