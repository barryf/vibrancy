const ogs = require('open-graph-scraper')
const logger = require('@architect/shared/logger')

function setName (result, properties) {
  if (result.ogTitle) {
    properties.name = [result.ogTitle]
  } else if (result.twitterTitle) {
    properties.name = [result.twitterTitle]
  }
}

function setContent (result, properties) {
  if (result.ogDescription) {
    properties.content = [result.ogDescription]
  } else if (result.twitterDescription) {
    properties.content = [result.twitterDescription]
  }
}

function setPhoto (result, properties) {
  if (result.ogImage) {
    properties.photo = [result.ogImage.url]
  } else if (result.twitterImage) {
    properties.photo = [result.twitterImage.url]
  }
}

function setAudio (result, properties) {
  if (result.ogAudioSecureURL) {
    properties.audio = [result.ogAudioSecureURL]
  } else if (result.ogAudioURL) {
    properties.audio = [result.ogAudioURL]
  }
}

function setAuthor (result, properties) {
  if (result.author) {
    properties.author = [{
      type: ['h-card'],
      properties: {
        name: [result.author]
      }
    }]
  }
}

async function fetchContext (url) {
  const { error, result, response } = await ogs({ url })
  if (error) {
    logger.warn('Failed to fetch context from source', `${url}\n${response}`)
    return
  }
  logger.info('OGS result', JSON.stringify(result, null, 2))

  const properties = {}
  setName(result, properties)
  setContent(result, properties)
  setPhoto(result, properties)
  setAudio(result, properties)
  setAuthor(result, properties)
  return properties
}

module.exports = { fetchContext }
