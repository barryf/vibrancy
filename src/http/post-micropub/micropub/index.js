const { create } = require('./create')
const { update } = require('./update')
const { deletePost } = require('./delete')
const { undelete } = require('./undelete')

async function action (scope, body) {
  switch (scope) {
    case 'create':
      return await create(scope, body)
    case 'draft':
      return await create(scope, body)
    case 'update':
      return await update(body)
    case 'delete':
      return await deletePost(body)
    case 'undelete':
      return await undelete(body)

      // if (!utils.isValidURL(body.url)) {
      //   return {
      //     statusCode: 400,
      //     body: JSON.stringify({
      //       error: 'invalid_parameter',
      //       error_description: 'The specified URL is not a valid URL'
      //     })
      //   }
      // }
  }
}

exports.micropub = { action }
