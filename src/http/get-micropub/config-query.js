const q = `
  syndicate-to
  config
  source
`.trim().split(/\s+/)
// TODO: contact, category

const syndicateTo = [
  {
    uid: 'https://twitter.com/barryf',
    name: 'Twitter (barryf)'
  }
]

const targets = {
  'syndicate-to': syndicateTo
}

const config = {
  'media-endpoint': process.env.MEDIA_ENDPOINT_URL,
  'syndicate-to': syndicateTo,
  q
}

exports.configQuery = { config, targets, q }
