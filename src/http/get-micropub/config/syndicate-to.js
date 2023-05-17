function syndicateTo (postType = null) {
  const twitter = {
    uid: `https://twitter.com/${process.env.TWITTER_ACCOUNT}`,
    name: 'Twitter'
  }
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
        { ...twitter, checked: true },
        { ...mastodon, checked: true },
        { ...bluesky, checked: true }
      ]
    case 'bookmark':
      return [
        { ...pinboard, checked: true }
      ]
    case 'article':
      return [
        { ...twitter, checked: true },
        { ...mastodon, checked: true },
        { ...bluesky, checked: true }
      ]
    case 'like':
      return [
        { ...twitter }
      ]
    case 'reply':
      return [
        { ...twitter },
        { ...mastodon }
      ]
    case 'repost':
      return [
        { ...twitter }
      ]
    case 'photo':
      return [
        { ...twitter }
      ]
    default:
      return [
        twitter,
        pinboard
      ]
  }
}

module.exports = syndicateTo
