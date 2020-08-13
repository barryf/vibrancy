const matter = require('gray-matter')
const { postsData } = require('@architect/shared/posts-data')

const { Octokit } = require('@octokit/rest')
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'vibrancy'
})

async function getGitHubFile (url) {
  const content = await octokit.repos.getContent({
    owner: 'barryf',
    repo: 'content',
    path: `${url}.md`,
    ref: 'transform-fm-md'
  })
  return Buffer.from(content.data.content, 'base64').toString()
}

async function upsert (matterData) {
  const post = {
    ...matterData.data,
    content: matterData.content
  }
  await postsData.put(post)
}

exports.handler = async function queue (event) {
  const url = JSON.parse(event.Records[0].body).url
  const file = await getGitHubFile(url)
  const matterData = matter(file)
  await upsert(url, matterData)
}
