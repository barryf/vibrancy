function syndicateTo (postType = null) {
  const twitter = {
    uid: 'https://twitter.com/barryf',
    name: 'Twitter (barryf)'
  }
  const pinboard = {
    uid: 'https://pinboard.in/barryf',
    name: 'Pinboard'
  }
  switch (postType) {
    case 'note':
      return [
        { ...twitter, checked: true }
      ]
    case 'bookmark':
      return [
        { ...pinboard, checked: true }
      ]
    case 'article':
      return [
        { ...twitter, checked: true }
      ]
    case 'like':
      return [
        { ...twitter }
      ]
    case 'reply':
      return [
        { ...twitter }
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
