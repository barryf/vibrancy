function isValidURL (string) {
  try {
    new URL(string) // eslint-disable-line
  } catch (_) {
    return false
  }
  return true
}

function flatten (post) {
  for (const key in post) {
    if (Array.isArray(post[key]) && post[key].length === 1) {
      post[key] = post[key][0]
    }
  }
}

function unflatten (post) {
  for (const key in post) {
    if (!Array.isArray(post[key])) {
      post[key] = [post[key]]
    }
  }
}

function sanitise (post) {
  const reservedProperties = ['action', 'url', 'access_token', 'h']
  for (const prop in post) {
    if (prop.startsWith('mp-') || reservedProperties.includes(prop)) {
      delete post[prop]
    }
    if (prop.endsWith('[]')) {
      const propModified = prop.slice(0, -2)
      post[propModified] = post[prop]
      delete post[prop]
    }
  }
}

const reservedSlugs = `
  notes
  articles
  bookmarks
  photos
  checkins
  reposts
  likes
  replies
  archives
`.trim().split(/\s+/)

exports.utils = {
  isValidURL,
  flatten,
  unflatten,
  sanitise,
  reservedSlugs
}
