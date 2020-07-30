const arc = require('@architect/functions')

function setLimit (opts, params) {
  let limit = 'limit' in params ? parseInt(params.limit, 10) : 20
  if (!limit || limit < 1) limit = 1
  opts.Limit = limit
}

function setBefore (opts, params) {
  if ('before' in params) {
    const before = new Date(parseInt(params.before, 10)).toISOString()
    opts.KeyConditionExpression = opts.KeyConditionExpression +
      ' and published < :before'
    opts.ExpressionAttributeValues[':before'] = before
  }
}

function setStatusAndVisibility (opts, params, scope) {
  if (scope === 'read') {
    opts.FilterExpression = '(visibility = :visibility ' +
      ' OR attribute_not_exists(visibility)' +
      ' ) AND (#postStatus = :postStatus' +
      ' OR attribute_not_exists(#postStatus))'
    opts.ExpressionAttributeNames['#postStatus'] = 'post-status'
    opts.ExpressionAttributeValues[':visibility'] = 'public'
    opts.ExpressionAttributeValues[':postStatus'] = 'published'
  }
}

async function findPostItems (params, scope) {
  if ('post-type' in params) {
    return await findPostsByPostType(params, scope)
  } else if ('category' in params) {
    // return await findPostsByCategory(params, scope)
  } else {
    return await findPostsAll(params, scope)
  }
}

async function findPostsByPostType (params, scope) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'post-type-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: '#postType = :postType',
    ExpressionAttributeNames: {
      '#postType': 'post-type'
    },
    ExpressionAttributeValues: {
      ':postType': params['post-type']
    }
  }
  setLimit(opts, params)
  setBefore(opts, params)
  setStatusAndVisibility(opts, params, scope)
  return await data.posts.query(opts)
}

async function findPostsAll (params, scope) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'published-index',
    ScanIndexForward: false
  }
  setLimit(opts, params)
  setBefore(opts, params)
  setStatusAndVisibility(opts, params, scope)
  return await data.posts.scan(opts)
}

// async function postsByCategory (params, scope) {
//   const data = await arc.tables()
//   const opts = {
//     IndexName: 'category-published-index',
//     ScanIndexForward: false,
//     KeyConditionExpression: 'category = :category',
//     ExpressionAttributeValues: {
//       ':category': params.category
//     }
//   }
//   setLimit(opts, params)
//   setBefore(opts, params)
//   setStatusAndVisibility(opts, params, scope)
//   return await data.posts.query(opts)
// }

async function getPost (slug) {
  const data = await arc.tables()
  const postData = await data.posts.get({ slug })
  if (!(postData === undefined ||
    ('visibility' in postData && postData.visibility === 'private'))) {
    return postData
  }
}

async function findWebmentions (absoluteUrl) {
  const data = await arc.tables()
  return await data.webmentions.query({
    IndexName: 'target-index',
    KeyConditionExpression: 'target = :target',
    ExpressionAttributeValues: {
      ':target': absoluteUrl
    }
  })
}

module.exports.query = {
  getPost,
  findPostItems,
  findWebmentions
}
