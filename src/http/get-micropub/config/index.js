const syndicateTo = require('./syndicate-to')
const category = require('./category')
const postTypes = require('./post-types')

const q = [
  'syndicate-to',
  'config',
  'source',
  'post-types',
  'category'
]
// TODO contact

const config = {
  'media-endpoint': process.env.MEDIA_ENDPOINT_URL,
  'post-types': postTypes,
  'syndicate-to': syndicateTo(),
  q
}

exports.config = {
  q,
  config,
  syndicateTo,
  category
}
