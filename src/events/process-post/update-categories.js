const arc = require('@architect/functions')

async function findExistingCategoriesPosts (url) {
  const data = await arc.tables()
  return data['categories-posts'].query({
    IndexName: 'url-index',
    KeyConditionExpression: '#url = :url',
    ExpressionAttributeNames: {
      '#url': 'url'
    },
    ExpressionAttributeValues: {
      ':url': url
    }
  })
}

async function updateCategories (post) {
  const data = await arc.tables()

  const category = ('category' in post.properties)
    ? post.properties.category
    : []
  const existingCategoriesPosts = await findExistingCategoriesPosts(post.url)

  // is this post private, i.e. not visible, a draft or deleted?
  // delete any matching categories-posts records if so
  if (
    ('visibility' in post.properties && post.properties.visibility[0] !== 'public') ||
    ('post-status' in post.properties && post.properties['post-status'][0] === 'draft') ||
    ('deleted' in post.properties)
  ) {
    existingCategoriesPosts.Items.forEach(async item => {
      await data['categories-posts'].delete({
        cat: item.cat,
        url: post.url
      })
    })
    return
  }

  // add categories-posts records for each of the post's categories
  // and a category record to the master list of categories
  category.forEach(async cat => {
    await data['categories-posts'].put({
      cat,
      ...post
    })
    await data.categories.put({ cat })
  })

  // remove any categories-posts records which no longer exist for this post
  existingCategoriesPosts.Items.forEach(async item => {
    if (!category.includes(item.cat)) {
      await data['categories-posts'].delete({
        cat: item.cat,
        url: post.url
      })
    }
  })
}

module.exports = updateCategories
