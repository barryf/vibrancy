function generateContent (post) {
  const absoluteUrl = new URL(post.url, process.env.ROOT_URL).href
  let content = ''
  if (post.properties.summary) {
    content = post.properties.summary[0] + ' ' + absoluteUrl
  } else if (post.properties.name) {
    content = post.properties.name[0] + ' ' + absoluteUrl
  } else if (post.properties.content &&
    typeof post.properties.content[0] === 'string') {
    content = post.properties.content[0]
  }
  return content
}

// append categories to the content if on special whitelist
function appendSpecialCategories (post) {
  let content = ''
  if (process.env.SYNDICATION_CATEGORIES) {
    const cats = process.env.SYNDICATION_CATEGORIES.split(',')
    for (const cat of cats) {
      if (post.properties.category.includes(cat)) {
        content += ' #' + cat
      }
    }
  }
  return content
}

module.exports = { generateContent, appendSpecialCategories }
