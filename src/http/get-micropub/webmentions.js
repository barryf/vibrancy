const query = require('./query')

async function setWebmentions (post) {
  const absoluteUrl = new URL(post.url, process.env.ROOT_URL).href
  const webmentionsData = await query.findWebmentions(absoluteUrl)
  if (webmentionsData.Count > 0) {
    const webmentionProperties = {
      'in-reply-to': 'comment',
      'like-of': 'like',
      'repost-of': 'repost',
      rsvp: 'rsvp',
      'bookmark-of': 'bookmark',
      'mention-of': 'mention'
    }
    webmentionsData.Items.forEach(webmention => {
      for (const prop in webmentionProperties) {
        if (webmention['wm-property'] === prop) {
          post.properties[webmentionProperties[prop]] =
            post.properties[webmentionProperties[prop]] || []
          post.properties[webmentionProperties[prop]].push({
            type: ['h-cite'],
            properties: webmention.properties
          })
        }
      }
    })
  }
}

module.exports = { setWebmentions }
