module.exports = [
  {
    type: 'note',
    name: 'Note',
    properties: [
      'summary',
      'content',
      'category',
      'post-status',
      'visibility'
    ],
    'required-properties': [
      'content'
    ]
  },
  {
    type: 'article',
    name: 'Article',
    properties: [
      'name',
      'summary',
      'content',
      'category',
      'post-status',
      'visibility'
    ],
    'required-properties': [
      'name',
      'content'
    ]
  },
  {
    type: 'bookmark',
    name: 'Bookmark'
  },
  {
    type: 'contact',
    name: 'Contacts',
    properties: [
      'name',
      'nickname',
      'url',
      'photo',
      'rel=twitter'
    ],
    'required-properties': [
      'name',
      'nickname',
      'url'
    ]
  },
  {
    type: 'photo',
    name: 'Photo'
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
    type: 'repost',
    name: 'Repost'
  },
  {
    type: 'rsvp',
    name: 'RSVP'
  },
  {
    type: 'checkin',
    name: 'Checkin'
  },
  {
    type: 'listen',
    name: 'Listen'
  }
]
