const arc = require('@architect/functions')
const logger = require('@architect/shared/logger')
const granary = require('./granary')
const openGraph = require('./open-graph')

async function getContext (url) {
  // try granary and then use opengraph
  const properties = await granary.fetchContext(url)
  if (properties) {
    return properties
  } else {
    return await openGraph.fetchContext(url)
  }
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
