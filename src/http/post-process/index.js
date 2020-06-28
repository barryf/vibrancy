const arc = require('@architect/functions')

async function queueDownloads (commits) {
  const slugs = []
  commits.forEach(async commit => {
    ['added', 'modified'].forEach(async method => {
      commit[method].forEach(async file => {
        const slug = file.slice(0, -3)
        slugs.push(slug)
        const payload = { slug, method }
        await arc.queues.publish({ name: 'download', payload })
      })
    })
  })
  return slugs
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)
  // console.log(`process req=${JSON.stringify(body)}`)

  // TODO check HTTP_X_HUB_SIGNATURE

  const slugs = await queueDownloads(body.commits)

  return {
    statusCode: 202,
    body: `Queued download of ${slugs.join(', ')}`
  }
}
