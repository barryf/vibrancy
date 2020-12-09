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
      channel: 'posts',
      url: item.url,
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
      })
    }
  })

  const webmentions = [
    {
      source: 'http://rhiaro.co.uk/2015/11/1446953889',
      target: 'http://localhost:4444/2020/08/source-control-in-the-1980s-using',
      published: '2015-11-08T03:38:09+00:00',
      'wm-property': 'repost-of',
      properties: {
        url: ['http://rhiaro.co.uk/2015/11/1446953889'],
        name: ['repost of http://aaronparecki.com/notes/2015/11/07/4/indiewebcamp'],
        published: ['2015-11-08T03:38:09+00:00'],
        'repost-of': ['http://aaronparecki.com/notes/2015/11/07/4/indiewebcamp'],
        author: [{
          type: ['h-card'],
          properties: {
            name: ['Amy Guy'],
            photo: ['http://webmention.io/avatar/rhiaro.co.uk/829d3f6e7083d7ee8bd7b20363da84d88ce5b4ce094f78fd1b27d8d3dc42560e.png'],
            url: ['http://rhiaro.co.uk/about#me']
          }
        }]
      }
    }
  ]
  webmentions.forEach(async wm => {
    await data.webmentions.put(wm)
  })
}

(async () => {
  await startup()
})()
