const arc = require('@architect/functions')

function setLimit (opts, params) {
  let limit = 'limit' in params ? parseInt(params.limit, 10) : 20
  if (!limit || limit < 1) limit = 1
  opts.Limit = limit
}

function setBefore (opts, params) {
  if ('before' in params) {
    const before = new Date(parseInt(params.before, 10)).toISOString()
    if ('KeyConditionExpression' in opts) {
      opts.KeyConditionExpression = opts.KeyConditionExpression + ' AND '
    } else {
      opts.KeyConditionExpression = ''
    }
    opts.KeyConditionExpression = opts.KeyConditionExpression +
      'published < :before'
    opts.ExpressionAttributeValues[':before'] = before
  }
}

function setStatusAndVisibility (opts, params, scopes) {
  // if we've *only* granted read access then enforce privacy
  if (scopes.length === 1 && scopes[0] === 'read') {
    if ('FilterExpression' in opts) {
      opts.FilterExpression = opts.FilterExpression + ' AND '
    } else {
      opts.FilterExpression = ''
    }
    opts.FilterExpression = opts.FilterExpression +
      ' (visibility = :visibility ' +
      ' OR attribute_not_exists(visibility)' +
      ' ) AND (#postStatus = :postStatus' +
      ' OR attribute_not_exists(#postStatus))'
    opts.ExpressionAttributeNames = ('ExpressionAttributeNames' in opts)
      ? opts.ExpressionAttributeNames : {}
    opts.ExpressionAttributeNames['#postStatus'] = 'post-status'
    opts.ExpressionAttributeValues = ('ExpressionAttributeValues' in opts)
      ? opts.ExpressionAttributeValues : {}
    opts.ExpressionAttributeValues[':visibility'] = 'public'
    opts.ExpressionAttributeValues[':postStatus'] = 'published'
  }
}

async function findPostItems (params, scopes) {
  if ('post-type' in params) {
    return await findPostsByPostType(params, scopes)
  } else if ('category' in params) {
    return await findPostsByCategory(params, scopes)
  } else if ('published' in params) {
    return await findPostsByPublished(params, scopes)
  } else {
    return await findPostsAll(params, scopes)
  }
}

async function findPostsByPostType (params, scopes) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'post-type-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: '#postType = :postType',
    ExpressionAttributeNames: {
      '#postType': 'post-type'
    },
    ExpressionAttributeValues: {
      ':channel': params.channel,
      ':postType': params['post-type']
    },
    FilterExpression: 'attribute_not_exists(deleted) AND channel = :channel'
  }
  setLimit(opts, params)
  setBefore(opts, params)
  setStatusAndVisibility(opts, params, scopes)
  return await data.posts.query(opts)
}

async function findPostsAll (params, scopes) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'channel-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: 'channel = :channel',
    ExpressionAttributeValues: {
      ':channel': 'posts'
    },
    FilterExpression: 'attribute_not_exists(deleted)'
  }
  setLimit(opts, params)
  setBefore(opts, params)
  setStatusAndVisibility(opts, params, scopes)
  return await data.posts.query(opts)
}

async function findPostsByPublished (params, scopes) {
  const published = params.published.replace(/[^0-9-]/, '')
  const data = await arc.tables()
  const opts = {
    IndexName: 'channel-published-index',
    ScanIndexForward: false,
    ExpressionAttributeValues: {
      ':channel': 'posts',
      ':published': published
    },
    FilterExpression: 'attribute_not_exists(deleted)'
  }
  if ('before' in params) {
    const before = new Date(parseInt(params.before, 10)).toISOString()
    opts.KeyConditionExpression =
      'channel = :channel AND published BETWEEN :published AND :before'
    opts.ExpressionAttributeValues[':before'] = before
  } else {
    opts.KeyConditionExpression =
      'channel = :channel AND begins_with(published, :published)'
  }
  setLimit(opts, params)
  setStatusAndVisibility(opts, params, scopes)
  return await data.posts.query(opts)
}

async function findPostsByCategory (params, scopes) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'cat-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: 'cat = :category',
    ExpressionAttributeValues: {
      ':category': params.category
    },
    FilterExpression: 'attribute_not_exists(deleted)'
  }
  setLimit(opts, params)
  setBefore(opts, params)
  setStatusAndVisibility(opts, params, scopes)
  const posts = await data['categories-posts'].query(opts)
  return {
    Items: posts.Items.map(item => {
      delete item.cat
      return item
    })
  }
}

async function getPost (url) {
  const data = await arc.tables()
  const postData = await data.posts.get({ url })
  if (!(postData === undefined ||
    ('visibility' in postData && postData.visibility === 'private'))) {
    return postData
  }
}

async function findWebmentions (absoluteUrl) {
  const data = await arc.tables()
  return await data.webmentions.query({
    IndexName: 'target-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: 'target = :target',
    ExpressionAttributeValues: {
      ':target': absoluteUrl
    }
  })
}

module.exports = {
  getPost,
  findPostItems,
  findWebmentions
}
