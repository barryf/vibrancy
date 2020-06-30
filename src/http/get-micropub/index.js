const arc = require('@architect/functions')
// const { micropub } = require('./micropub')

function verifyUrl (url) {
  return true
}

function unflattenProperties (properties) {
  for (const prop in properties) {
    if (!Array.isArray(properties[prop])) {
      properties[prop] = [properties[prop]]
    }
  }
}

async function renderSource (req) {
  const url = req.queryStringParameters.url
  if (!verifyUrl(url)) {
    return { body: 'URL is invalid.' }
  }
  const slug = url.replace(process.env.ROOT_URL, '')
  const data = await arc.tables()
  const postData = await data.posts.get({ slug })
  if (postData === undefined) return { body: 'Not found' }
  const properties = { ...postData.properties }
  unflattenProperties(properties)
  return {
    body: JSON.stringify({
      type: ['h-entry'],
      properties
    })
  }
}

exports.handler = async function http (req) {
  if ('q' in req.queryStringParameters) {
    switch (req.queryStringParameters.q) {
      case 'source':
        return await renderSource(req)
    }
  }
  // if params.key?('q')
  //       require_auth
  //       content_type :json
  //       case params[:q]
  //       when 'source'
  //         render_source
  //       when 'config'
  //         render_config
  //       when 'syndicate-to'
  //         render_syndication_targets
  //       else
  //         # Silently fail if query method is not supported
  //       end
  //     else
  //       'Micropub endpoint'
  //     end
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: 'hello'
  }
}
