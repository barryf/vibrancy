const arc = require('@architect/functions')

async function toResponse (items) {
  const inner = items.reduce(function (result, item, _) {
    result[item.hashtag] = item.replacement
    return result
  }, {})

  return {
    replacements: inner
  }
}

async function hashtagReplacements (filter) {
  const data = await arc.tables()
  const table = data['hashtag-replacements']
  if (filter) {
    const results = await table.scan({
      ScanFilter: {
        hashtag: {
          ComparisonOperator: 'BEGINS_WITH',
          AttributeValueList: [
            `#${filter}`
          ]
        }
      }
    })
    return await toResponse(results.Items)
  } else {
    const results = await table.scan({})
    return await toResponse(results.Items)
  }
}

module.exports = {
  hashtagReplacements
}
