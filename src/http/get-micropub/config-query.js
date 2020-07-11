const q = `
  syndicate-to
  config
  source
`.trim().split(/\s+/)
// TODO: contact, category

const syndicateTo = [
  {
    uid: 'https://twitter.com/barryf',
    name: 'Twitter (barryf)',
    service: {
      name: 'Twitter',
      url: 'https://twitter.com'
    },
    user: {
      name: 'barryf',
      url: 'https://twitter.com/barryf'
    }
  }
]

function targets () {
  return {
    'syndicate-to': syndicateTo
  }
}

function config () {
  return {
    'media-endpoint': process.env.MEDIA_ENDPOINT_URL,
    'syndicate-to': syndicateTo,
    q
  }
}

exports.configQuery = { config, targets, q }
