const arc = require('@architect/functions')

async function category (filter = '') {
  const data = await arc.tables()
  const opts = {
    KeyConditionExpression: '#type = :type',
    ExpressionAttributeNames: { '#type': 'type' },
    ExpressionAttributeValues: { ':type': 'tag' }
  }
  if (filter) {
    // sanitise filter
    filter = filter.toLowerCase().replace(/[^a-z0-9-]/, '')
    opts.KeyConditionExpression =
      '#type = :type and begins_with(category, :filter)'
    opts.ExpressionAttributeValues = {
      ':type': 'tag',
      ':filter': filter
    }
  }
  const results = await data.categories.query(opts)
  const categories = results.Items.map(cat => { return cat.category }).sort()
  return categories
}

exports.category = category
