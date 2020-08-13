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

async function writeGitHubFile (url, method, content) {
  return await octokit.repos.createOrUpdateFileContents({
    owner: 'barryf',
    repo: 'content',
    branch: 'transform-fm-md',
    path: `${url}.md`,
    message: `Post ${method} by Vibrancy`,
    content
  })
}

async function doFile (post, method) {
  const content = formatContent(post)
  const response = await writeGitHubFile(post.url, method, content)
  if (response.status >= 400) return { statusCode: response.status }
  return {
    statusCode: response.status,
    error: 'github_error',
    error_description: response.message
  }
}

async function createFile (post) {
  return await doFile(post, 'added')
}

async function updateFile (post) {
  return await doFile(post, 'edited')
}

async function deleteFile (post) {
  return await doFile(post, 'deleted')
}

async function undeleteFile (post) {
  return await doFile(post, 'undeleted')
}

exports.github = { createFile, updateFile, deleteFile, undeleteFile }
