const arc = require('@architect/functions')
const matter = require('gray-matter')

const { Octokit } = require('@octokit/rest')
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'vibrancy'
})

async function getGitHubFile (slug) {
  const content = await octokit.repos.getContent({
    owner: 'barryf',
    repo: 'content',
    path: `${slug}.md`,
    ref: 'transform-fm-md'
  })
  return Buffer.from(content.data.content, 'base64').toString()
}

async function upsert (slug, matterData) {
  const data = await arc.tables()
  const post = {
    ...matterData.data,
    content: matterData.content
  }
  await data.posts.put(post)
}

exports.handler = async function queue (event) {
  const slug = JSON.parse(event.Records[0].body).slug
  const file = await getGitHubFile(slug)
  const matterData = matter(file)
  await upsert(slug, matterData)
}
