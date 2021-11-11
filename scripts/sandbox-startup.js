const arc = require('@architect/functions')
const fs = require('fs')
const path = require('path')
const dataPosts = require('../src/shared/data-posts')

async function startup () {
  if (process.env.NODE_ENV === 'production' || process.env.PORT === '3334') return

  const data = await arc.tables()

  const postsRaw = fs.readFileSync(path.join(__dirname, '/posts.json'), 'utf8')
  const items = JSON.parse(postsRaw)

  for (const item of items.items) {
    const properties = item.properties
    const postType = item.properties['entry-type'][0].replace(/^h-/, '')
    delete properties['entry-type']
    const post = {
      channel: item.channel ? item.channel[0] : 'posts',
      url: item.url[0],
      published: item.properties.published[0],
      'post-type': postType,
      type: item.type[0],
      properties
    }
    await dataPosts.put(post)
    if (post.properties.category) {
      for (const cat of post.properties.category) {
        await data['categories-posts'].put({
          cat,
          ...post
        })
        await data.categories.put({ cat })
      }
    }
  }

  const webmentionsRaw = fs.readFileSync(path.join(__dirname, '/webmentions.json'), 'utf8')
  const webmentions = JSON.parse(webmentionsRaw)
  for (const item of webmentions.items) {
    const id = `${item.source} ${item.target}`
    await data.webmentions.put({ ...item, id })
  }

  const contactsRaw = fs.readFileSync(path.join(__dirname, '/contacts.json'), 'utf8')
  const contacts = JSON.parse(contactsRaw)
  for (const c of contacts.contacts) {
    await data.contacts.put(c)
  }
}

(async () => {
  await startup()
})()
