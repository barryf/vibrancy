const arc = require('@architect/functions')

exports.handler = async function http (req) {
  if (req.path === '/favicon.ico') { return }

  const slug = req.path.substr(1)
  const data = await arc.tables()
  const post = await data.posts.get({slug})

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/plain; charset=utf8'
    },
    body: `${post.properties.content[0]}`
  }
}