const arc = require('@architect/functions')
const crypto = require('crypto')

function verifySignature (signature, payload) {
  const hmac = crypto.createHmac('sha1', process.env.GITHUB_SECRET)
  const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8')
  const checksum = Buffer.from(signature, 'utf8')
  return (checksum.length !== digest.length ||
    !crypto.timingSafeEqual(digest, checksum))
}

async function queueDownloads (commits) {
  const urls = []
  commits.forEach(async commit => {
    // don't process if this commit has come via micropub
    if (commit.message.match(/Vibrancy$/) === null) {
      ['added', 'modified'].forEach(async method => {
        commit[method].forEach(async file => {
          const url = file.slice(0, -3)
          urls.push(url)
          const payload = { url, method }
          await arc.queues.publish({ name: 'download', payload })
        })
      })
    }
  })
  return urls
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)

  // check signature from github matches secret
  if ('X-Hub-Signature' in req.headers &&
    verifySignature(req.headers['X-Hub-Signature'], JSON.stringify(body))) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'forbidden',
        error_description: 'GitHub webhook signatures did not match.'
      })
    }
  }

  const urls = await queueDownloads(body.commits)
  const message = urls.length > 0 ? `Queued download of ${urls.join(', ')}`
    : 'No files were added/modified.'
  return {
    statusCode: 202,
    body: JSON.stringify({ message })
  }
}
