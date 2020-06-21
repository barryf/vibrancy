// `upsert`
// * Creates/updates post in DynamoDB via MF2 JSON in message
// * Columns for slug, published, kind, properties
// * Sends SQS `ping` messages with new/updated URL

const arc = require('@architect/functions')

exports.handler = async function queue (event) {
  const data = await arc.tables()
  const post = JSON.parse(event.Records[0].body)
  await data.posts.put(post)
}