const fetch = require('node-fetch')
const { utils } = require('@architect/shared/utils')

async function syndicate (post) {
  const opts = {
    auth_token: process.env.PINBOARD_AUTH_TOKEN,
    url: post['bookmark-of'],
    description: post.name,
    extended: post.content,
    dt: post.published
  }
  if (post.category && Array.isArray(post.category)) {
    opts.tags = post.category.map(cat => {
      if (!utils.isValidURL(cat)) return cat
    }).filter((el) => el != null) // remove nulls
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .join(',')
  }
  const url = 'https://api.pinboard.in/v1/posts/add?' +
    new URLSearchParams(opts)
  await fetch(url)
}

module.exports = { syndicate }
