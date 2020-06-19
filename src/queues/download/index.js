// `download(path)`
// * Fetches file from GitHub
// * Extracts YAML/content and creates MF2 JSON object
// * Passes MF2 JSON string to `upsert` SQS message

const arc = require('@architect/functions')
const fetch = require('node-fetch')

// const baseUrl = "https://raw.githubusercontent.com/barryf/content/transform-fm-md/"

async function getGitHubFile(slug, method) {

}

exports.handler = async function queue (event) {
  console.log(JSON.stringify(event, null, 2))

  const slug = event.path
  const response = await fetch(`${baseUrl}${slug}.md`)
  const text = await response.text()
  const post = matter(text)

  const payload = {
    slug: slug,
    kind: post.data.kind[0],
    properties: {
      ...post.data,
      content: [post.content]
    }
  }
  await arc.queues.publish({ name: 'upsert', payload })
  return
}