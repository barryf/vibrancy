// `download(path)`
// * Fetches file from GitHub
// * Extracts YAML/content and creates MF2 JSON object
// * Passes MF2 JSON string to `upsert` SQS message

const arc = require('@architect/functions')
const fetch = require('node-fetch')
const matter = require('gray-matter')
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'vibrancy'
})

async function getGitHubFile(slug) {
  const content = await octokit.repos.getContent({
    owner: 'barryf',
    repo: 'content',
    path: `${slug}.md`,
    ref: 'transform-fm-md'
  })
  return Buffer.from(content.data.content, 'base64').toString()
}

exports.handler = async function queue (event) {
  const slug = JSON.parse(event.Records[0].body).slug
  const file = await getGitHubFile(slug)
  const post = matter(file)

  const payload = {
    slug: slug,
    published: post.data.published[0],
    kind: post.data.kind[0],
    properties: {
      ...post.data,
      content: [post.content]
    }
  }
  await arc.queues.publish({ name: 'upsert', payload })
  return
}