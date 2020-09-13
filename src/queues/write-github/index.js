const arc = require('@architect/functions')
const { Octokit } = require('@octokit/rest')
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'Vibrancy https://github.com/barryf/vibrancy'
})

const githubConfig = {
  owner: 'barryf',
  repo: 'content',
  ref: 'transform-fm-md'
}

function textToBase64 (fileContent) {
  return Buffer.from(fileContent, 'utf8').toString('base64')
}

function formatPostFile (post) {
  const fileContent = JSON.stringify({
    type: ['h-entry'],
    'post-type': [post['post-type']],
    properties: post.properties
  }, null, 2)
  // encode as base64 for github's api
  return textToBase64(fileContent)
}

async function writeGitHubFile (path, method, file) {
  const params = {
    path,
    message: `File ${method}d by Vibrancy`,
    content: file,
    branch: githubConfig.ref,
    ...githubConfig
  }
  // check if file already exists (and we're updating)
  try {
    const response = await octokit.repos.getContent({
      path,
      ...githubConfig
    })
    params.sha = response.data.sha
  } catch (err) {
    // assume file was not found
  }
  return await octokit.repos.createOrUpdateFileContents(params)
}

exports.handler = async function queue (event) {
  const body = JSON.parse(event.Records[0].body)
  const data = await arc.tables()
  let path, file
  let method = 'create'

  if (body.folder === 'posts' || body.folder === 'pages') {
    const post = await data.posts.get({ url: body.url })
    // treat a draft as a create
    method = body.method === 'draft' ? 'create' : body.method
    file = formatPostFile(post)
    path = `${post.channel}/${post.url}.json`
  } else if (body.folder === 'webmentions') {
    const webmention = await data.webmentions.get({
      source: body.source,
      target: body.target
    })
    file = textToBase64(JSON.stringify(webmention, null, 2))
    // TODO: webmentions path
    path = 'webmentions/'
  } else if (body.folder === 'files') {
    // TODO: files
  }

  if (file) {
    await writeGitHubFile(path, method, file)
  }
}
