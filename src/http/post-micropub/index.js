const arc = require('@architect/functions')

exports.handler = async function http (req) {
  const payload = { slug: '2018/04/leaving-venntro', method: 'update' }
  await arc.queues.publish({ name: 'download', payload })

  return {
    statusCode: 202,
    headers: {
      'Location': 'http://localhost:3333/2018/04/leaving-venntro'
    }
  }
}