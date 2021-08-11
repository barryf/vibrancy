const arc = require('@architect/functions')

async function category (filter = '') {
  if (filter) {
    filter = filter.toLowerCase().replace(/[^a-z0-9-]/, '')
  }
  const data = await arc.tables()
  const results = await data.categories.scan({})
  const categories = results.Items.map(c => {
    if (filter) {
      if (c.cat.startsWith(filter)) {
        return c.cat
      } else {
        return null
      }
    } else {
      return c.cat
    }
  }).filter((el) => el != null) // remove nulls
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .sort()
  return categories
}

module.exports = category
