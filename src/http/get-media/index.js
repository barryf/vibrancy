const arc = require('@architect/functions')
const { auth } = require('@architect/shared/auth')

async function query (params) {
  const data = await arc.tables()
  const opts = {
    IndexName: 'type-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: '#type = :type',
    ExpressionAttributeNames: {
      '#type': 'type'
    },
    ExpressionAttributeValues: {
      ':type': 'image'
    }
  }
  let limit = 'limit' in params ? parseInt(params.limit, 10) : 20
  if (!limit || limit < 1) limit = 1
  opts.Limit = limit
  return await data.media.query(opts)
}

async function source (params) {
  const mediaData = await query(params)
  return { items: mediaData.Items }
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)
  const authResponse = await auth.requireScope('media', req.headers, body)
  if (process.env.NODE_ENV === 'production' &&
    authResponse.statusCode !== 200) return authResponse

  const params = req.queryStringParameters || {}
  if ('q' in params && params.q === 'source') {
    return await source(params)
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: 'Micropub media endpoint'
  }
}
