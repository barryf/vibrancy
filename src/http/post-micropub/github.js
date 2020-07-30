const matter = require('gray-matter')

const { Octokit } = require('@octokit/rest')
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'Vibrancy https://github.com/barryf/vibrancy'
})

function formatContent (post) {
  const properties = { ...post }
  // remove content from the properties object
  const content = properties.content || ''
  delete properties.content
  // create a front-matter/content string from properties
  const fileContent = matter.stringify(content, properties)
  // encode as base64 for github's api
  return Buffer.from(fileContent, 'utf8').toString('base64')
}

async function writeGitHubFile (slug, method, content) {
  return await octokit.repos.createOrUpdateFileContents({
    owner: 'barryf',
    repo: 'content',
    branch: 'transform-fm-md',
    path: `${slug}.md`,
    message: `Post ${method} by Vibrancy`,
    content
  })
}

async function createFile (post) {
  const content = formatContent(post)
  return await writeGitHubFile(post.slug, 'added', content)
}

exports.github = { createFile }
