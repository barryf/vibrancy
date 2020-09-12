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

function formatFile (post) {
  const fileContent = JSON.stringify({
    type: ['h-entry'],
    properties: post.properties
  }, 2, null)
  // encode as base64 for github's api
  return Buffer.from(fileContent, 'utf8').toString('base64')
}

async function writeGitHubFile (path, method, file) {
  const params = {
    path,
    message: `Post ${method}d by Vibrancy`,
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
  const post = await data.posts.get({ url: body.url })

  // treat a draft as a create
  const method = body.method === 'draft' ? 'create' : body.method

  const file = formatFile(post)
  const path = `${post.channel}/${post.url}.json`
  await writeGitHubFile(path, method, file)
}
