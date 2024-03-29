const arc = require('@architect/functions')
const micropub = require('./micropub')
const { requireScopes } = require('@architect/shared/auth')

const allowedActions = ['create', 'update', 'delete', 'undelete']

exports.handler = async function http (req) {
  let body = arc.http.helpers.bodyParser(req)
  // extra check in case json body wasn't detected and parsed
  if (typeof body === 'string') { body = JSON.parse(body) }

  let scope = 'create' // default to create
  if ('action' in body) {
    if (!allowedActions.includes(body.action)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          error: 'not_supported',
          error_description: 'The specified action is not supported'
        })
      }
    }
    scope = body.action
  }

  // allow draft scope if we're creating
  let allowedScopes = [scope]
  if (scope === 'create') {
    allowedScopes = ['create', 'draft']
  }
  const authResponse = await requireScopes(allowedScopes, req.headers, body)
  if (authResponse.statusCode >= 400) return authResponse

  return await micropub.action(scope, body)
}
