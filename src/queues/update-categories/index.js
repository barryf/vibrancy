const arc = require('@architect/functions')

exports.handler = async function queue (event) {
  const data = await arc.tables()
  const url = JSON.parse(event.Records[0].body).url
  const post = await data.posts.get({ url })
  const category = ('category' in post.properties)
    ? post.properties.category
    : []

  // add categories-posts records for each of the post's categories
  category.forEach(async cat => {
    console.log('cat', cat)
    await data['categories-posts'].put({
      cat,
      ...post
    })
  })

  // remove any categories-posts records which no longer exist for this post
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
