const fetch = require('node-fetch')
const { utils } = require('@architect/shared/utils')

async function syndicate (post) {
  const opts = {
    auth_token: process.env.PINBOARD_AUTH_TOKEN,
    url: post.properties['bookmark-of'][0],
    description: post.properties.name[0],
    extended: post.properties.content[0],
    dt: post.properties.published[0]
  }
  if (post.properties.category && Array.isArray(post.properties.category)) {
    opts.tags = post.properties.category.map(cat => {
      if (!utils.isValidURL(cat)) return cat.trim()
    }).filter((el) => el != null) // remove nulls
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .join(',')
  }
  const url = 'https://api.pinboard.in/v1/posts/add?' +
    new URLSearchParams(opts)
  await fetch(url)
}

module.exports = { syndicate }
