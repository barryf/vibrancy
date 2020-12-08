const arc = require('@architect/functions')
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
  const data = await arc.tables()

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

    await data.posts.put(res.post)

    // remove public post if no longer public (not visible, a draft or deleted)
    if (
      ('visibility' in res.post.properties && res.post.properties.visibility[0] !== 'public') ||
      ('post-status' in res.post.properties && res.post.properties['post-status'][0] === 'draft') ||
      ('deleted' in res.post.properties)
    ) {
      await data['posts-public'].delete({ url: res.post.url })
    } else {
      await data['posts-public'].put(res.post)
    }

    await arc.events.publish({
      name: 'write-github',
      payload: {
        folder: res.post.channel,
        url: res.post.url,
        method: scope
      }
    })

    await arc.events.publish({
      name: 'update-categories',
      payload: { url: res.post.url }
    })

    // queue syndication if requested
    if (syndicateTo) {
      await arc.events.publish({
        name: 'syndicate',
        payload: {
          url: res.post.url,
          syndicateTo
        }
      })
    }

    await arc.events.publish({
      name: 'send-webmentions',
      payload: { url: res.post.url }
    })
  }

  return {
    statusCode: res.statusCode,
    headers: res.headers || {}
  }
}

module.exports = { action }
