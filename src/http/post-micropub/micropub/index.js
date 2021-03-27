const arc = require('@architect/functions')
const logger = require('@architect/shared/logger')
const dataPosts = require('@architect/shared/data-posts')
const create = require('./create')
const update = require('./update')
const deletePost = require('./delete')
const undelete = require('./undelete')

function setRootProperties (post) {
  post.published = post.properties.published[0]
  if ('mp-channel' in post.properties) {
    post.channel = post.properties['mp-channel'][0]
  } else {
    post.channel = 'posts' // default channel is posts
  }
}

function sanitise (post) {
  const reservedProperties = ['action', 'access_token', 'h']
  for (const prop in post.properties) {
    if (prop.startsWith('mp-') || reservedProperties.includes(prop)) {
      delete post.properties[prop]
    }
    if (prop.endsWith('[]')) {
      const propModified = prop.slice(0, -2)
      post.properties[propModified] = post.properties[prop]
      delete post.properties[prop]
    }
  }
}

async function action (scope, body) {
  let res
  if (scope === 'create' || scope === 'draft') {
    res = await create(scope, body)
  } else if (scope === 'update') {
    res = await update(body)
  } else if (scope === 'delete') {
    res = await deletePost(body)
  } else if (scope === 'undelete') {
    res = await undelete(body)
  }

  // if the action was successful...
  if (res.statusCode < 300) {
    // set root properties indexed by ddb
    setRootProperties(res.post)

    // keep syndication options before sanitising
    let syndicateTo
    if ('mp-syndicate-to' in res.post.properties) {
      syndicateTo = Array.isArray(res.post.properties['mp-syndicate-to'])
        ? res.post.properties['mp-syndicate-to']
        : [res.post.properties['mp-syndicate-to']]
    }
    sanitise(res.post)

    await dataPosts.put(res.post)

    logger.info(`${scope.toUpperCase()}D ${res.post.url}`)

    // async tasks after post is created/updated
    await arc.events.publish({
      name: 'process-post',
      payload: {
        url: res.post.url,
        syndicateTo,
        scope
      }
    })
  }

  return {
    statusCode: res.statusCode,
    headers: res.headers || {}
  }
}

module.exports = { action }
