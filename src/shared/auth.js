const arc = require('@architect/functions')
const fetch = require('node-fetch')

async function requireAuth (headers, body = {}) {
  let token = headers.Authorization ||
    (body && 'access_token' in body ? body.access_token : '')
  token = token.trim().replace(/^Bearer /, '')
  if (token === '') {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: 'unauthorized',
        message: 'Micropub endpoint did not return an access token.'
      })
    }
  }
  const scope = (body && 'action' in body) ? body.action : 'create'
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
    tokenData = await getTokenResponse(token, 'https://tokens.indieauth.com/token')
    if (!tokenData || tokenData.me !== 'https://barryfrost.com/') {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'forbidden',
          message: 'The authenticated user does not have permission' +
            ' to perform this request.'
        })
      }
    }
    await data.tokens.put({ token, data: tokenData })
  }
  if ('scope' in tokenData) {
    const scopes = tokenData.scope.split(' ')
    if (scopes.includes(scope)) { return true }
    // if we want to post and are allowed to create then go ahead
    if (scope === 'post' && scopes.includes('create')) { return true }
  }
  return {
    statusCode: 401,
    body: JSON.stringify({
      error: 'insufficient_scope',
      message: 'The user does not have sufficient scope to perform this action.'
    })
  }
}

exports.auth = { requireAuth, verifyTokenAndScope }
