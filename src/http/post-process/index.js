const arc = require('@architect/functions')

async function postExists (slug) {
  const data = await arc.tables()
  const post = await data.posts.get({ slug })
  return post.slug === slug
}

async function queueDownloads (commits) {
  const slugs = []
  commits.forEach(async commit => {
    ['added', 'modified'].forEach(async method => {
      commit[method].forEach(async file => {
        const slug = file.slice(0, -3)
        // don't upsert post if we've already added it (via micropub)
        if (method === 'added' && await postExists(slug)) {
          console.log(`Ignoring adding ${slug} because it already exists.`)
        } else {
          slugs.push(slug)
          const payload = { slug, method }
          await arc.queues.publish({ name: 'download', payload })
        }
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
  const result = slugs.length > 0 ? `Queued download of ${slugs.join(', ')}`
    : 'No files were added/modified.'

  return {
    statusCode: 202,
    body: result
  }
}
