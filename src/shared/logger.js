const crypto = require('crypto')
const arc = require('@architect/functions')

async function log (type, message, description) {
  const data = await arc.tables()
  const published = new Date()
  const expires = Math.floor((new Date().setDate(new Date().getDate() + 7)) / 1000)
  const log = {
    log: 'log',
    id: crypto.randomBytes(8).toString('hex'),
    type: type.toLowerCase(),
    published: published.toISOString(),
    message,
    description,
    expires
  }
  if (process.env.ARC_ROLE && process.env.ARC_ROLE === 'SandboxRole') {
    console.log(JSON.stringify(log))
  }
  await data.logs.put(log)
}

async function info (message, description = null) {
  await log('info', message, description)
}

async function warn (message, description = null) {
  await log('warn', message, description)
}

async function error (message, description = null) {
  await log('error', message, description)
}

module.exports = {
  info,
  warn,
  error
}
