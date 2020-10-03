const test = require('tape')
const sandbox = require('@architect/sandbox')
const index = require('../src/http/get-index')

test('start', async t => {
  t.plan(1)
  const result = await sandbox.start()
  t.equal(result, 'Sandbox successfully started')
})

test('index returns Vibrancy', async t => {
  t.plan(1)
  const response = await index.handler()
  t.equal(response.body, 'Vibrancy')
})

test('end', async t => {
  t.plan(1)
  const result = await sandbox.end()
  t.equal(result, 'Sandbox successfully shut down')
})
