const util = require('util')
const arc = require('@architect/functions')
const logger = require('@architect/shared/logger')
const { createId, wmType, postToMf2 } = require('./functions')

exports.handler = async function http (req) {
  const data = await arc.tables()
  const body = arc.http.helpers.bodyParser(req)

  if (!('secret' in body) || body.secret !== process.env.WEBMENTION_IO_SECRET) {
    logger.warn('Webmention secret does not match', JSON.stringify(body, null, 2))
    return {
      body: JSON.stringify({
        error: 'unauthorized',
        error_description: 'Secret does not match.'
      }),
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      statusCode: 403
    }
  }

  // remove secret from body to avoid being logged
  delete body.secret

  const source = body.post.url
  const target = body.target
  const id = createId(source, target)

  // convert to utc
  let published = body.post.published || body.post['wm-received']
  try {
    published = new Date(published)
  } catch (e) {
    published = new Date()
  }
  published = published.toISOString().replace(/\.000Z$/, 'Z')

  logger.info(`Webmention received from ${source}`, JSON.stringify(body, null, 2))

  const webmention = {
    id,
    source,
    target,
    published,
    'wm-property': body.post['wm-property'],
    properties: postToMf2(body.post)
  }

  const existingWebmention = await data.webmentions.get({ id })

  // ignore webmention if it's unchanged
  // logger.info('Webmention comparison', JSON.stringify(webmention) + '\n' + JSON.stringify(existingWebmention))
  if (util.isDeepStrictEqual(webmention, existingWebmention)) {
    logger.info("Ignored webmention because it's been received previously")
  } else {
    await data.webmentions.put(webmention)

    await arc.events.publish({
      name: 'write-file',
      payload: {
        folder: 'webmentions',
        id
      }
    })

    // send pushover notification
    const payload = {
      url: target,
      title: `Received ${wmType(body.post['wm-property'])}`,
      message: source
    }
    if (('author' in body.post) && ('name' in body.post.author)) {
      payload.message = body.post.author.name + '\n' + source
    }
    await arc.events.publish({
      name: 'notify-push',
      payload
    })
  }

  // notify any endpoints (e.g. barryfrost) that post changed
  await arc.events.publish({
    name: 'notify-endpoints',
    payload: { url: target.replace(process.env.ROOT_URL, '') }
  })

  return {
    statusCode: 202
  }
}
