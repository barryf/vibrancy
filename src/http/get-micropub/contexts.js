const arc = require('@architect/functions')
const { isValidURL } = require('@architect/shared/utils')

async function setContexts (post) {
  const data = await arc.tables()
  const urlProps = ['in-reply-to', 'repost-of', 'like-of', 'bookmark-of', 'listen-of']

  for (const prop of urlProps) {
    if ((prop in post.properties) && Array.isArray(post.properties[prop])) {
      for (const i in post.properties[prop]) {
        const url = post.properties[prop][i]
        if (isValidURL(url)) {
          const context = await data.contexts.get({ url })
          if (context) {
            if (context.properties) {
              post.properties[prop][i] = {
                type: ['h-cite'],
                properties: { url: [url], ...context.properties }
              }
            }
          }
        }
      }
    }
  }
}

module.exports = { setContexts }
