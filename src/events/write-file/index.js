const arc = require('@architect/functions')
const logger = require('@architect/shared/logger')

let provider
if (process.env.FILE_PROVIDER === 'gitlab') {
  provider = require('./gitlab')
} else {
  provider = require('./github')
}

function formatPostFile (post) {
  const fileContent = JSON.stringify({
    type: [post.type],
    'post-type': [post['post-type']],
    properties: post.properties
  }, null, 2)
  return Buffer.from(fileContent, 'utf8').toString('base64')
}

async function formatFileFile (url) {
  const response = await fetch(url)
  const file = await response.buffer()
  return Buffer.from(file).toString('base64')
}

exports.handler = async function subscribe (event) {
  const body = JSON.parse(event.Records[0].Sns.Message)
  const data = await arc.tables()
  let path, file
  let method = 'create'
  let entity = 'file'

  if (body.folder === 'posts' || body.folder === 'pages') {
    const post = await data.posts.get({ url: body.url })
    // treat a draft as a create
    method = body.method === 'draft' ? 'create' : body.method
    file = formatPostFile(post)
    // path like posts/2020/09/foo.json
    path = `${post.channel}/${post.url}.json`
    entity = post.channel === 'posts' ? post['post-type'] : 'page'
    //
  } else if (body.folder === 'webmentions') {
    const webmention = await data.webmentions.get({ id: body.id })
    const fileContent = JSON.stringify(webmention, null, 2)
    file = Buffer.from(fileContent, 'utf8').toString('base64')
    // path like webmentions/2020/09/foo/https---example-org-bar-html.json
    const targetPath = webmention.target.replace(process.env.ROOT_URL, '')
    const sourcePath = webmention.source.replace(/[^A-Za-z0-9]/g, '-')
    path = `webmentions/${targetPath}/${sourcePath}.json`
    entity = webmention['wm-property']
    //
  } else if (body.folder === 'files') {
    file = await formatFileFile(body.url)
    path = `files/${body.filePath}`
    //
  } else {
    logger.error('Unknown folder when writing file', body.folder)
  }

  if (file) {
    try {
      await provider.writeFile(path, method, file, entity)
      logger.info(`Wrote ${entity} to ${path}`)
    } catch (err) {
      logger.error('Error writing file', JSON.stringify(err, null, 2))
    }
  }
}
