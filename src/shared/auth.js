const arc = require('@architect/functions')
const fetch = require('node-fetch')
const { jsonify } = require('@architect/shared/utils')

const tokenEndpoint = process.env.TOKEN_ENDPOINT ||
  'https://tokens.indieauth.com/token'

async function requireScope (scope, headers, body) {
  let token = headers.Authorization || headers.authorization ||
    (body && 'access_token' in body ? body.access_token : '')
  token = token.trim().replace(/^Bearer /, '')
  console.log('headers', headers)
  if (token === '') {
    return jsonify({
      error: 'unauthorized',
      error_description: 'Request is missing an access token.'
    }, 401)
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
  if (process.env.NODE_ENV !== 'production') return { statusCode: 200, scope }

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
      return jsonify({
        error: 'forbidden',
        error_description: 'The authenticated user does not have permission' +
          ' to perform this request.'
      }, 403)
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
  return jsonify({
    error: 'insufficient_scope',
    error_description: 'The user does not have sufficient scope to perform' +
      ' this action.'
  }, 401)
}

exports.auth = { requireScope }
