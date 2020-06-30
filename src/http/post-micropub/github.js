const matter = require('gray-matter')

const { Octokit } = require('@octokit/rest')
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'vibrancy'
})

function formatContent (post) {
  const properties = { ...post.properties }
  // remove content from the properties object
  const content = properties.content
  delete properties.content
  // create a front-matter/content string from properties
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

const createFile = async function (post) {
  const content = formatContent(post)
  const response = await writeGitHubFile(post.slug, 'added', content)
  return response
}

exports.micropub = { createFile }
