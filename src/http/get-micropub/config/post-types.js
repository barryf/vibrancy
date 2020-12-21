module.exports = [
  {
    type: 'note',
    name: 'Note',
    properties: [
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
    type: 'bookmark',
    name: 'Bookmark'
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
  }
]
