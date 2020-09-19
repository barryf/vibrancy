// TODO: mf2
const arc = require('@architect/functions')
const {
  unflatten,
  flattenJSON,
  sanitise,
  derivePostType
} = require('@architect/shared/utils')

function verifyObjectNotArray (properties, key) {
  if (!(typeof properties[key] === 'object' &&
    !Array.isArray(properties[key]))) {
    throw new Error(
      `Invalid request: the '${key}' property should be an object`
    )
  }
}

function verifyArrayOrObject (properties, key) {
  if (!(typeof properties[key] === 'object')) {
    throw new Error(
      `Invalid request: the '${key}' property should be an array of object`
    )
  }
}

async function update (properties) {
  const data = await arc.tables()
  const url = properties.url.replace(process.env.ROOT_URL, '')
  const post = await data.posts.get({ url })
  unflatten(post)
  console.log(`post=${JSON.stringify(post)}`)

  try {
    if ('replace' in properties) {
      verifyObjectNotArray(properties, 'replace')
      for (const prop in properties.replace) {
        post[prop] = properties.replace[prop]
      }
    }
    if ('add' in properties) {
      verifyObjectNotArray(properties, 'add')
      for (const prop in properties.add) {
        if (!(prop in post)) {
          post[prop] = properties.add[prop]
        } else {
          post[prop] = post[prop].concat(properties.add[prop])
        }
      }
    }
    if ('delete' in properties) {
      verifyArrayOrObject(properties, 'delete')
      if (!Array.isArray(properties.delete)) {
        for (const prop in properties.delete) {
          post[prop] = post[prop].filter((p) => p != properties.delete[prop]) // eslint-disable-line
          if (post[prop].length === 0) {
            delete post[prop]
          }
        }
      } else {
        properties.delete.forEach(prop => {
          delete post[prop]
        })
      }
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'invalid_request',
        error_description: e.message
      })
    }
  }

  flattenJSON(post)
  let syndicateTo
  if ('mp-syndicate-to' in post) {
    syndicateTo = Array.isArray(post['mp-syndicate-to'])
      ? post['mp-syndicate-to']
      : [post['mp-syndicate-to']]
  }
  sanitise(post)
  post['post-type'] = derivePostType(post)
  post.url = url
  post.updated = new Date().toISOString()

  return {
    post,
    syndicateTo,
    statusCode: 204
  }
}

exports.update = update
