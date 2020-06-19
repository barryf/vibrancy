// `process`
// * barryfrost.com/process
// * Receives webhook with payload from GitHub and processes via Lambda
// * Secures POST request via secret token
// * Sends `download` SQS message with path of file

const arc = require('@architect/functions')

async function queueDownloads(commits) {
  let slugs = []
  for (const commit in commits) {
    for (const method in ['added', 'modified']) {
      for (const filename in commit[method]) {
        const slug = filename
        slugs.push(slug)
        const payload = { slug, method } // TODO: strip slug
        await arc.queues.publish({ name: 'download', payload })
      }
    }
  }
  return slugs
}

exports.handler = async function http (req) {
  // throw unless 'commits' key in req

  // check HTTP_X_HUB_SIGNATURE

  const slugs = await queueDownloads(req.commits)

  return {
    statusCode: 201,
    body: `Received webhook and queued download of: ${slugs.split(', ')}`
  }
}