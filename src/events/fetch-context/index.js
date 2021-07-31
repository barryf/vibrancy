const arc = require('@architect/functions')
const logger = require('@architect/shared/logger')
const eventbrite = require('./eventbrite')
const granary = require('./granary')
const meetup = require('./meetup')
const openGraph = require('./open-graph')

async function getContext (url) {
  // for specific sites, use custom parsing
  if (meetup.isMeetupUrl(url)) {
    const properties = await meetup.fetchContext(url)
    if (properties) {
      return properties
    }
  } else if (eventbrite.isEventbriteUrl(url)) {
    const properties = await eventbrite.fetchContext(url)
    if (properties) {
      return properties
    }
  }
  // otherwise fallback to Granary, and then OpenGraph
  const properties = await granary.fetchContext(url)
  if (properties) {
    return properties
  }

  return await openGraph.fetchContext(url)
}

exports.handler = async function subscribe (event) {
  const data = await arc.tables()
  const { url } = JSON.parse(event.Records[0].Sns.Message)
  const properties = await getContext(url)
  await data.contexts.put({
    url,
    properties
  })
  logger.info(`Context fetched ${url}`, JSON.stringify(properties))
}
