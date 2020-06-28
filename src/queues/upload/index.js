const arc = require('@architect/functions')
const matter = require('gray-matter')

const { Octokit } = require('@octokit/rest')
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: 'vibrancy'
})

function formatContent (post) {
  // remove content from the properties object
  const content = post.properties[0]
  const properties = { ...post.properties }
  delete properties.content
  // create a front-matter/content string
  const fileContent = matter.stringify(content, properties)
  return fileContent
}

async function writeGitHubFile (slug, method, content) {
  await octokit.repos.createOrUpdateFileContents({
    owner: 'barryf',
    repo: 'content',
    ref: 'transform-fm-md',
    path: `${slug}.md`,
    message: `Post ${method} by Vibrancy.`,
    content
  })
}

exports.handler = async function queue (event) {
  const data = await arc.tables()
  const body = JSON.parse(event.Records[0].body)
  const post = await data.posts.get({ slug: body.slug })
  const content = formatContent(post)
  await writeGitHubFile(body.slug, body.method, content)
}
