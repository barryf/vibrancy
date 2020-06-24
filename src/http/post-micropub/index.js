const arc = require('@architect/functions')

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)
  const data = await arc.tables()

  console.log(`req=${JSON.stringify(body)}`)

  //if ("Authorization" in req.headers) {

  if ("action" in req.body) {
    // verify_action
    // require_auth
    // verify_url
    action(body)
    // return send202()
  }

  // add a post
  const slug = '2020/06/foo'
  const published = '2020-06-22T21:56:00Z'
  const kind = ['note']
  const row = {
    slug: slug,
    published: '2020-06-22T21:56:00Z',
    kind: 'note',
    properties: JSON.stringify({
      slug: [slug],
      published: [published],
      kind: [kind],
      content: ["This is my content."],
      category: ['one', 'two']
    })
  }
  await data.posts.put(row)

  await arc.queues.publish({ name: 'upload', payload: { slug } })

  return {
    statusCode: 202,
    headers: {
      'Location': 'http://localhost:3333/2020/06/foo'
    }
  }
}