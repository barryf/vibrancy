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

// assumption is that public clients won't have the create scope
function isPublicClient (scopes) {
  return !scopes.includes('create')
}

async function findPostItems (params, scopes) {
  if ('post-type' in params) {
    return await findPostsByPostType(params, scopes)
  } else if ('category' in params) {
    return await findPostsByCategory(params, scopes)
  } else if ('published' in params) {
    return await findPostsByPublished(params, scopes)
  } else if ('homepage' in params) {
    return await findPostsHomepage(params)
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
      ':postType': params['post-type']
    }
  }
  setLimit(opts, params)
  setBefore(opts, params)
  if (isPublicClient(scopes)) {
    return await data['posts-public'].query(opts)
  } else {
    return await data.posts.query(opts)
  }
}

async function findPostsHomepage (params) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'homepage-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: 'homepage = :homepage',
    ExpressionAttributeValues: {
      ':homepage': 1
    }
  }
  setLimit(opts, params)
  setBefore(opts, params)
  return await data['posts-public'].query(opts)
}

async function findPostsAll (params, scopes) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'channel-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: 'channel = :channel',
    ExpressionAttributeValues: {
      ':channel': 'posts'
    }
  }
  setLimit(opts, params)
  setBefore(opts, params)
  if (isPublicClient(scopes)) {
    return await data['posts-public'].query(opts)
  } else {
    return await data.posts.query(opts)
  }
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
    }
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
  if (isPublicClient(scopes)) {
    return await data['posts-public'].query(opts)
  } else {
    return await data.posts.query(opts)
  }
}

async function findPostsByCategory (params, scopes) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'cat-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: 'cat = :category',
    ExpressionAttributeValues: {
      ':category': params.category
    }
  }
  setLimit(opts, params)
  setBefore(opts, params)
  const posts = await data['categories-posts'].query(opts)
  return {
    Items: posts.Items.map(item => {
      delete item.cat
      return item
    })
  }
}

async function getPost (url, scopes) {
  const data = await arc.tables()
  const post = await data.posts.get({ url })
  if (post === undefined) return
  if (!('visibility' in post.properties &&
    post.properties.visibility[0] === 'private' &&
    isPublicClient(scopes))) {
    return post
  }
}

async function findWebmentions (absoluteUrl) {
  const data = await arc.tables()
  return await data.webmentions.query({
    IndexName: 'target-published-index',
    ScanIndexForward: true,
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
