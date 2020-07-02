const arc = require('@architect/functions')
const fetch = require('node-fetch')

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
  let tokenData = await data.tokens.get({ token })
  if (!tokenData) {
    tokenData = await getTokenResponse(token, 'https://tokens.indieauth.com/token')
    if (!tokenData || tokenData.me !== 'https://barryfrost.com') {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'forbidden',
          message: 'The authenticated user does not have permission' +
            ' to perform this request.'
        })
      }
    }
    await data.tokens.put(token, tokenData)
  }
  if ('scope' in tokenData && Array.isArray(tokenData.scope)) {
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

exports.github = { verifyTokenAndScope }
