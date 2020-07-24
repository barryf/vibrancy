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

exports.configQuery = { config, targets, q }
