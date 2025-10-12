function syndicateTo (postType = null) {
  const pinboard = {
    uid: `https://pinboard.in/${process.env.PINBOARD_ACCOUNT}`,
    name: 'Pinboard'
  }
  const mastodon = {
    uid: process.env.MASTODON_URL,
    name: 'Mastodon'
  }
  const bluesky = {
    uid: `bluesky-${process.env.BLUESKY_IDENTIFIER}`,
    name: 'Bluesky'
  }
  switch (postType) {
    case 'note':
      return [
        { ...mastodon },
        { ...bluesky }
      ]
    case 'bookmark':
      return [
        { ...pinboard, checked: true }
      ]
    case 'article':
      return [
        { ...mastodon },
        { ...bluesky }
      ]
    case 'like':
      return []
    case 'reply':
      return [
        { ...mastodon }
      ]
    case 'repost':
      return []
    case 'photo':
      return [
        { ...mastodon },
        { ...bluesky }
      ]
    default:
      return [
        pinboard
      ]
  }
}

module.exports = syndicateTo
