const util = require('util')
const test = require('tape')
const index = require('../src/http/post-webmention')

test('post is correctly formatted to mf2', async t => {
  t.plan(1)
  const now = new Date().toISOString()
  const original = {
    url: 'http://example.org/1',
    name: 'Example post',
    published: now,
    author: {
      name: 'Barry Frost',
      photo: 'https://barryfrost.com/barryfrost.jpg',
      url: 'https://barryfrost.com'
    },
    content: {
      text: 'My content in plain text.'
    },
    'in-reply-to': 'https://barryfrost.com/original'
  }
  const expected = {
    url: ['http://example.org/1'],
    name: ['Example post'],
    published: [now],
    author: [{
      type: ['h-card'],
      properties: {
        name: ['Barry Frost'],
        photo: ['https://barryfrost.com/barryfrost.jpg'],
        url: ['https://barryfrost.com']
      }
    }],
    content: ['My content in plain text.'],
    'in-reply-to': ['https://barryfrost.com/original']
  }
  const mf2 = index._postToMf2(original)
  const result = util.isDeepStrictEqual(mf2, expected)
  t.ok(result, 'postToMf2 correctly formats jf2')
})
