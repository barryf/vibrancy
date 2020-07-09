const arc = require('@architect/functions')

async function startup () {
  const data = await arc.tables()
  const posts = [
    {
      slug: '2020/07/foo',
      published: '2020-07-09T16:17:00',
      'post-type': 'note',
      content: 'Foo'
    }
  ]
  posts.forEach(async post => {
    await data.posts.put(post)
  })
}
module.exports = startup
