const arc = require('@architect/functions')
const { micropub } = require('./micropub')
const { auth } = require('@architect/shared/auth')

const allowedActions = ['create', 'update', 'delete', 'undelete', 'draft']

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)
  console.log(`body=${JSON.stringify(body)}`)

  let scope = 'create' // default to create
  if ('action' in body) {
    if (!allowedActions.includes(body.action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'not_supported',
          error_description: 'The specified action is not supported'
        })
      }
    }
    scope = body.action
  }

  const authResponse = await auth.requireScope(scope, req.headers, body)
  if (authResponse.statusCode >= 400) return authResponse

  return await micropub.action(scope, body)
}
