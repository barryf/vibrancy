const arc = require('@architect/functions')

async function category () {
  const data = await arc.tables()
  const posts = await data.posts.scan({
    AttributesToGet: ['category']
  })
  const cats = posts.Items.map(item => item.category)
  const uniqueCats = cats.flat().filter((v, i, a) => a.indexOf(v) === i)
  const orderedSimpleCats = uniqueCats.map(cat => {
    if (cat && cat.constructor === String) return cat
  }).filter(cat => cat != null).sort()
  return { categories: orderedSimpleCats }
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

const syndicateTo = [
  {
    uid: 'https://twitter.com/barryf',
    name: 'Twitter (barryf)'
  }
]

const targets = {
  'syndicate-to': syndicateTo
}

const q = [
  'syndicate-to',
  'config',
  'source',
  'post-types'
]
// TODO contact, category

const config = {
  'media-endpoint': process.env.MEDIA_ENDPOINT_URL,
  'post-types': postTypes,
  'syndicate-to': syndicateTo,
  q
}

exports.configQuery = {
  config,
  targets,
  q,
  category
}
