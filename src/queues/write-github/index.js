const arc = require('@architect/functions')
const matter = require('gray-matter')
const { Octokit } = require('@octokit/rest')
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'Vibrancy https://github.com/barryf/vibrancy'
})

function formatFile (post) {
  const properties = { ...post }
  // remove content from the properties object
  let content = ''
  if ('content' in properties) {
    if (typeof post.content === 'string') {
      content = post.content.trim()
    } else {
      content = post.content.html.trim()
    }
  }
  delete properties.content
  // create a front-matter/content string from properties
  const fileContent = matter.stringify(content, properties)
  // encode as base64 for github's api
  return Buffer.from(fileContent, 'utf8').toString('base64')
}

async function writeGitHubFile (url, method, file) {
  return await octokit.repos.createOrUpdateFileContents({
    owner: 'barryf',
    repo: 'content',
    branch: 'transform-fm-md',
    path: `${url}.md`,
    message: `Post ${method}d by Vibrancy`,
    content: file
  })
}

exports.handler = async function queue (event) {
  const body = JSON.parse(event.Records[0].body)

  const data = await arc.tables()
  const post = await data.posts.get({ url: body.url })

  // treat a draft as a create
  const method = body.method === 'draft' ? 'create' : body.method

  const file = formatFile(post)
  await writeGitHubFile(post.url, method, file)
}
