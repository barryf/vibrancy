const arc = require('@architect/functions')

async function category (filter) {
  const data = await arc.tables()
  // sanitise filter
  filter = filter.toLowerCase().replace(/[^a-z0-9-]/, '')
  const opts = {
    KeyConditionExpression: '#type = :type',
    ExpressionAttributeNames: { '#type': 'type' },
    ExpressionAttributeValues: { ':type': 'tag' }
  }
  if (filter) {
    opts.KeyConditionExpression =
      '#type = :type and begins_with(category, :filter)'
    opts.ExpressionAttributeValues = {
      ':type': 'tag',
      ':filter': filter
    }
  }
  const results = await data.categories.query(opts)
  const categories = results.Items.map(cat => { return cat.category }).sort()
  return categories
}

const postTypes = [
  {
    type: 'note',
    name: 'Note'
  },
  {
    type: 'article',
    name: 'Article'
  },
  {
    type: 'bookmark',
    name: 'Bookmark'
  },
  {
    type: 'photo',
    name: 'Photo'
  },
  {
    type: 'checkin',
    name: 'Checkin'
  },
  {
    type: 'repost',
    name: 'Repost'
  },
  {
    type: 'like',
    name: 'Like'
  },
  {
    type: 'reply',
    name: 'Reply'
  },
  {
    type: 'rsvp',
    name: 'RSVP'
  }
]

function syndicateTo (postType = null) {
  const twitter = {
    uid: 'https://twitter.com/barryf',
    name: 'Twitter (barryf)'
  }
  const pinboard = {
    uid: 'https://pinboard.in/barryf',
    name: 'Pinboard'
  }
  switch (postType) {
    case 'note':
      return [
        { ...twitter, checked: true }
      ]
    default:
      return [
        twitter,
        pinboard
      ]
  }
}

const q = [
  'syndicate-to',
  'config',
  'source',
  'post-types',
  'category'
]
// TODO contact

const config = {
  'media-endpoint': process.env.MEDIA_ENDPOINT_URL,
  'post-types': postTypes,
  'syndicate-to': syndicateTo(),
  q
}

exports.configQuery = {
  q,
  config,
  syndicateTo,
  category
}
