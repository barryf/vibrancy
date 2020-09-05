const fetch = require('node-fetch')

async function syndicate (post) {
  const response = await fetch('https://micro.blog/micropub', {
    method: 'post',
    body: {
      type: [`h-${post.type}`],
      properties: post.properties
    },
    headers: {
      Authorization: `Bearer ${process.env.MICRO_BLOG_TOKEN}`
    }
  })
  if (response.statusCode === 202) {
    return response.headers.get('Location')
  }
}

module.exports = { syndicate }
