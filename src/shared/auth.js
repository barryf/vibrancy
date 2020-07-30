const arc = require('@architect/functions')
const fetch = require('node-fetch')

const tokenEndpoint = process.env.TOKEN_ENDPOINT ||
  'https://tokens.indieauth.com/token'

async function requireScope (scope, headers, body) {
  let token = headers.Authorization ||
    (body && 'access_token' in body ? body.access_token : '')
  token = token.trim().replace(/^Bearer /, '')
  if (token === '') {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'unauthorized',
        error_description: 'Request is missing an access token.'
      })
    }
  }
  return await verifyTokenAndScope(token, scope)
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

const verifyTokenAndScope = async function (token, scope) {
  const data = await arc.tables()
  const tokenRecord = await data.tokens.get({ token })
  let tokenData
  if (tokenRecord) {
    tokenData = tokenRecord.data
    console.log('token found')
  } else {
    console.log('token not found')
    tokenData = await getTokenResponse(
      token,
      tokenEndpoint
    )
    // TODO: move my URL to an env var
    if (!tokenData || tokenData.me !== process.env.ME_URL) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'forbidden',
          error_description: 'The authenticated user does not have permission' +
            ' to perform this request.'
        })
      }
    }
    await data.tokens.put({ token, data: tokenData })
  }
  if ('scope' in tokenData) {
    const scopes = tokenData.scope.split(' ')
    if (scopes.includes(scope)) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: `Scope ${scope} was authorised.` }),
        scope
      }
    }
  }
  return {
    statusCode: 401,
    body: JSON.stringify({
      error: 'insufficient_scope',
      error_description: 'The user does not have sufficient scope to perform' +
        ' this action.'
    })
  }
}

exports.auth = { requireScope }
