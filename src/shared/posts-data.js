const arc = require('@architect/functions')

async function updateCategoriesPosts (post) {
  const data = await arc.tables()

  const category = ('category' in post) ? post.category : []

  // add categoriesPosts records for each of the post's categories
  category.forEach(async cat => {
    // console.log('cat', cat)
    await data['categories-posts'].put({
      cat,
      ...post
    })
  })

  // remove any categoriesPosts records which no longer exist for this post
  const existingCategoriesPosts = await data['categories-posts'].query({
    IndexName: 'url-index',
    KeyConditionExpression: '#url = :url',
    ExpressionAttributeNames: {
      '#url': 'url'
    },
    ExpressionAttributeValues: {
      ':url': post.url
    }
  })
  existingCategoriesPosts.Items.forEach(async item => {
    if (!category.includes(item.cat)) {
      await data['categories-posts'].delete({ cat: item.cat, url: post.url })
    }
  })
}

async function put (post) {
  const data = await arc.tables()

  await data.posts.put(post)
  await updateCategoriesPosts(post)
}

exports.postsData = { put }
