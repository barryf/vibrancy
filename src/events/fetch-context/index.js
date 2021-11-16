const arc = require('@architect/functions')
const logger = require('@architect/shared/logger')
const booksMf2 = require('./books-mf2')
const eventbrite = require('./eventbrite')
const granary = require('./granary')
const meetup = require('./meetup')
const openGraph = require('./open-graph')

async function getHandler (url) {
  if (meetup.isMeetupUrl(url)) {
    return meetup
  } else if (eventbrite.isEventbriteUrl(url)) {
    return eventbrite
  } else if (booksMf2.isBooksMf2Url(url)) {
    return booksMf2
  } else {
    return granary
  }
}

async function getContext (handler, url) {
  // if our fetching fails, fallback to OpenGraph
  const properties = await handler.fetchContext(url)
  if (properties) {
    logger.info(`Context fetched ${url} using ${handler.name()}`, JSON.stringify(properties))
    return properties
  }

  logger.info(`Context fetching ${url} using fallback ${openGraph.name()}`, JSON.stringify(properties))
  return await openGraph.fetchContext(url)
}

exports.handler = async function subscribe (event) {
  const data = await arc.tables()
  const { url } = JSON.parse(event.Records[0].Sns.Message)
  const handler = await getHandler(url)
  const properties = await getContext(handler, url)
  await data.contexts.put({
    url,
    properties
  })
}
