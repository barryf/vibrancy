const arc = require('@architect/functions')

function isValidUrl (string) {
  try {
    new URL(string) // eslint-disable-line
  } catch (_) {
    return false
  }
  return true
}

async function getCategories () {
  const data = await arc.tables()
  const posts = await data.posts.scan({
    AttributesToGet: ['category']
  })
  const cats = posts.Items.map(item => item.category)
  const uniqueCategories = cats.flat().filter((v, i, a) => a.indexOf(v) === i)
  const categories = uniqueCategories.map(category => {
    if (category && category.constructor === String) {
      let type = 'tag'
      if (isValidUrl(category)) {
        type = 'contact'
      }
      return { type, category }
    }
  }).filter(category => category != null)
  return categories
}

exports.handler = async function scheduled (event) {
  const data = await arc.tables()
  const categories = await getCategories()
  categories.forEach(async category => await data.categories.put(category))
}
