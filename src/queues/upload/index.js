const arc = require('@architect/functions')
const matter = require('gray-matter')

const { Octokit } = require('@octokit/rest')
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'vibrancy'
})

function formatContent (post) {
  // remove content from the properties object
  const properties = JSON.parse(post.properties)
  const content = properties.content[0]
  delete properties.content
  // create a front-matter/content string
  const fileContent = matter.stringify(content, properties)
  // encode as base64 for github's api
  const base64Content = Buffer.from(fileContent, 'utf8').toString('base64')
  return base64Content
}

async function writeGitHubFile (slug, method, content) {
  await octokit.repos.createOrUpdateFileContents({
    owner: 'barryf',
    repo: 'content',
    branch: 'transform-fm-md',
    path: `${slug}.md`,
    message: `Post ${method} by Vibrancy`,
    content
  })
}

exports.handler = async function queue (event) {
  const data = await arc.tables()
  const body = JSON.parse(event.Records[0].body)
  const post = await data.posts.get({ slug: body.slug })
  const content = formatContent(post)
  // console.log(`content=${JSON.stringify(content)}`)
  await writeGitHubFile(body.slug, body.method, content)
}
