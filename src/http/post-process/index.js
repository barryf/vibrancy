// `process`
// * barryfrost.com/process
// * Receives webhook with payload from GitHub and processes via Lambda
// * Secures POST request via secret token
// * Sends `download` SQS message with path of file

const arc = require('@architect/functions')

async function queueDownloads(commits) {
  let slugs = []
  commits.forEach(commit => {
    ['added', 'modified'].forEach(method => {
      commit[method].forEach(commit => {
        const slug = filename.slice(0,-3)
        slugs.push(slug)
        const payload = { slug, method } 
        await arc.queues.publish({ name: 'download', payload })
      })
    })
  })
  return slugs
}

exports.handler = async function http (req) {
  // TODO throw unless 'commits' key in req

  // TODO check HTTP_X_HUB_SIGNATURE

  const slugs = await queueDownloads(req.commits)

  return {
    statusCode: 201,
    body: `Received webhook and queued download of: ${slugs.join(', ')}`
  }
}