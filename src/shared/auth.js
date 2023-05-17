const arc = require('@architect/functions')
const logger = require('./logger')

const tokenEndpoint = process.env.TOKEN_ENDPOINT ||
  'https://tokens.indieauth.com/token'

async function requireScopes (scopes, headers, body) {
  if (process.env.NODE_ENV !== 'production') {
    return { statusCode: 200, scopes: ['create', 'read'] }
  }

  let token = headers.Authorization || headers.authorization ||
    (body && 'access_token' in body ? body.access_token : '')
  token = token.trim().replace(/^Bearer /, '')
  if (token === '') {
    return {
      body: JSON.stringify({
        error: 'unauthorized',
        error_description: 'Request is missing an access token.'
      }),
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      statusCode: 401
    }
  }
  return await verifyTokenAndScopes(token, scopes)
}

async function getTokenResponse (token, endpoint) {
  const response = await fetch(endpoint, {
    method: 'get',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
  const result = await response.json()
  const tokenEnd = token.slice(-6)
  logger.info(`Token (...${tokenEnd}) requested from token endpoint`, JSON.stringify(result))
  return result
}

const verifyTokenAndScopes = async function (token, scopes) {
  const data = await arc.tables()
  const tokenRecord = await data.tokens.get({ token })
  let tokenData
  if (tokenRecord) {
    tokenData = tokenRecord.data
  } else {
    tokenData = await getTokenResponse(
      token,
      tokenEndpoint
    )
    if (!tokenData || tokenData.me !== process.env.ME_URL) {
      return {
        body: JSON.stringify({
          error: 'forbidden',
          error_description: 'The authenticated user does not have permission' +
            ' to perform this request.'
        }),
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        statusCode: 401
      }
    }
    // expire token after 7 days
    const expires = Math.floor(new Date().setDate(new Date().getDate() + 7) / 1000)
    await data.tokens.put({ token, data: tokenData, expires })
  }
  if ('scope' in tokenData) {
    const tokenScopes = tokenData.scope.split(' ')
    if (tokenScopes.some(scope => scopes.includes(scope))) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Scope was authorised.' }),
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        scopes: tokenScopes
      }
    }
  }
  return {
    body: JSON.stringify({
      error: 'insufficient_scope',
      error_description: 'The user does not have sufficient scope to perform' +
        ' this action.'
    }),
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    statusCode: 401
  }
}

module.exports = { requireScopes }
