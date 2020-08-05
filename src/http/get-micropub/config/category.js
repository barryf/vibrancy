const arc = require('@architect/functions')

async function category (filter = '') {
  if (filter) {
    filter = filter.toLowerCase().replace(/[^a-z0-9-]/, '')
  }
  const data = await arc.tables()
  const results = await data['categories-posts'].scan({
    AttributesToGet: ['cat']
  })
  const categories = results.Items.map(cp => {
    if (filter) {
      if (cp.cat.startsWith(filter)) {
        return cp.cat
      }
    } else {
      return cp.cat
    }
  }).filter((el) => el != null) // remove nulls
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .sort()
  return categories
}

module.exports = category
