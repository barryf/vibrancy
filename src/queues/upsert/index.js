// `upsert`
// * Creates/updates post in DynamoDB via MF2 JSON in message
// * Columns for slug, kind, content, properties
// * Sends SQS `ping` messages with new/updated URL

const arc = require('@architect/functions')

exports.handler = async function queue (event) {
  const data = await arc.tables()
  event.Records.forEach(async record => {
    const post = JSON.parse(record.body)
    await data.posts.put(post)
  })
}