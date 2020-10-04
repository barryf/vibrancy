const test = require('tape')
const sandbox = require('@architect/sandbox')
const fetch = require('node-fetch')
const { isValidURL } = require('../src/shared/utils')
const url = 'http://localhost:3334/micropub'

test('start', async t => {
  t.plan(1)
  const result = await sandbox.start()
  t.equal(result, 'Sandbox successfully started')
})

test('set up post', async t => {
  t.plan(1)
  const data = await sandbox.tables()
  const post = {
    channel: 'posts',
    url: '2020/10/example',
    published: '2020-10-03T17:11:06Z',
    'post-type': 'note',
    properties: {
      content: ['example'],
      category: [
        'one',
        'two'
      ],
      published: ['2020-10-03T17:11:06Z']
    }
  }
  await data.posts.put(post)
  // await data.queues.publish({
  //   name: 'update-categories',
  //   payload: { url: post.url }
  // })
  t.ok(true, 'post created')
})

test('index returns Micropub endpoint', async t => {
  t.plan(1)
  const response = await fetch(url)
  const body = await response.text()
  t.equal(body, 'Micropub endpoint')
})

test('q=config returns config object with q key', async t => {
  t.plan(1)
  const response = await fetch(`${url}?q=config`)
  const body = await response.json()
  t.ok(('q' in body))
})

test('q=config returns a media endpoint', async t => {
  t.plan(3)
  const response = await fetch(`${url}?q=config`)
  const body = await response.json()
  t.ok(('media-endpoint' in body))
  t.ok(body['media-endpoint'])
  t.ok(isValidURL(body['media-endpoint']))
})

test('q=syndicate-to returns syndications', async t => {
  t.plan(4)
  const response = await fetch(`${url}?q=syndicate-to`)
  const body = await response.json()
  t.ok(('syndicate-to' in body))
  t.ok(body['syndicate-to'])
  t.ok(Array.isArray(body['syndicate-to']))
  t.ok(body['syndicate-to'].length > 0)
})

test('end', async t => {
  t.plan(1)
  const result = await sandbox.end()
  t.equal(result, 'Sandbox successfully shut down')
})
