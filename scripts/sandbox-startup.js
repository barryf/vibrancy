const arc = require('@architect/functions')
const fs = require('fs')
const path = require('path')

async function startup () {
  if (process.env.NODE_ENV === 'production' || process.env.PORT === '3334') return

  const data = await arc.tables()

  const postsRaw = fs.readFileSync(path.join(__dirname, '/posts.json'), 'utf8')
  const items = JSON.parse(postsRaw)

  items.items.forEach(async item => {
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
    await data.posts.put(post)
    await data['posts-public'].put(post)
    if (post.properties.category) {
      post.properties.category.forEach(async cat => {
        await data['categories-posts'].put({
          cat,
          ...post
        })
        await data.categories.put({ cat })
      })
    }
  })

  const webmentionsRaw = fs.readFileSync(path.join(__dirname, '/webmentions.json'), 'utf8')
  const webmentions = JSON.parse(webmentionsRaw)

  webmentions.items.forEach(async item => {
    await data.webmentions.put(item)
  })
}

(async () => {
  await startup()
})()
