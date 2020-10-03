const test = require('tape')
const sandbox = require('@architect/sandbox')
const fetch = require('node-fetch')
const url = 'http://localhost:3334/micropub'

test('start', async t => {
  t.plan(1)
  const result = await sandbox.start()
  t.equal(result, 'Sandbox successfully started')
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
  t.plan(1)
  const response = await fetch(`${url}?q=config`)
  const body = await response.json()
  t.ok(('media-endpoint' in body) && body['media-endpoint'])
})

test('end', async t => {
  t.plan(1)
  const result = await sandbox.end()
  t.equal(result, 'Sandbox successfully shut down')
})
