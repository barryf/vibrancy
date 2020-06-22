const arc = require('@architect/functions')

exports.handler = async function http (req) {
  // const payload = { slug: '2018/04/leaving-venntro', method: 'update' }
  // await arc.queues.publish({ name: 'download', payload })

  const data = await arc.tables()
  const slug = '2020/06/foo'
  const row = {
    slug: slug,
    published: '2020-06-22T21:56:00Z',
    kind: 'note',
    properties: JSON.stringify({
      content: ["This is my content."],
      kind: ['note'],
      published: ['2020-06-22T21:56:00Z'],
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