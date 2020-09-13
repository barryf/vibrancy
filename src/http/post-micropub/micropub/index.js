const arc = require('@architect/functions')

const { create } = require('./create')
const { update } = require('./update')
const { deletePost } = require('./delete')
const { undelete } = require('./undelete')

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
    // add post to ddb
    await data.posts.put(res.post)

    // queue writing the file to github
    await arc.queues.publish({
      name: 'write-github',
      payload: {
        url: res.post.url,
        method: scope
      }
    })

    // queue category caching
    await arc.queues.publish({
      name: 'update-categories',
      payload: { url: res.post.url }
    })

    // queue syndication if requested
    if (res.syndicateTo) {
      await arc.queues.publish({
        name: 'syndicate',
        payload: {
          url: res.post.url,
          syndicateTo: res.syndicateTo
        }
      })
    }

    await arc.queues.publish({
      name: 'send-webmentions',
      payload: { url: res.post.url }
    })
  }

  return {
    statusCode: res.statusCode,
    headers: res.headers || {}
  }
}

exports.micropub = { action }
