const arc = require('@architect/functions')

exports.handler = async function http (req) {
  const payload = { slug: '2018/04/leaving-venntro', method: 'update' } 
  await arc.queues.publish({ name: 'download', payload })

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: `done`
  }
}