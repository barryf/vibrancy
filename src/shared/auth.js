const arc = require('@architect/functions')
const fetch = require('node-fetch')

const tokenEndpoint = process.env.TOKEN_ENDPOINT ||
  'https://tokens.indieauth.com/token'

async function requireScopes (scopes, headers, body) {
  if (process.env.NODE_ENV !== 'production') {
    return { statusCode: 200, scopes: ['read'] }
  }

  let token = headers.Authorization || headers.authorization ||
    (body && 'access_token' in body ? body.access_token : '')
  token = token.trim().replace(/^Bearer /, '')
  if (token === '') {
    return {
      json: {
        error: 'unauthorized',
        error_description: 'Request is missing an access token.'
      },
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
  return await response.json()
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
        json: {
          error: 'forbidden',
          error_description: 'The authenticated user does not have permission' +
            ' to perform this request.'
        },
        statusCode: 401
      }
    }
    await data.tokens.put({ token, data: tokenData })
  }
  if ('scope' in tokenData) {
    const tokenScopes = tokenData.scope.split(' ')
    if (tokenScopes.some(scope => scopes.includes(scope))) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Scope was authorised.' }),
        scopes: tokenScopes
      }
    }
  }
  return {
    json: {
      error: 'insufficient_scope',
      error_description: 'The user does not have sufficient scope to perform' +
        ' this action.'
    },
    statusCode: 401
  }
}

module.exports = { requireScopes }
