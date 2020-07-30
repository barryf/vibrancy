function syndicateTo (postType = null) {
  const twitter = {
    uid: 'https://twitter.com/barryf',
    name: 'Twitter (barryf)'
  }
  const pinboard = {
    uid: 'https://pinboard.in/barryf',
    name: 'Pinboard'
  }
  const microblog = {
    uid: 'https://micro.blog/barryf',
    name: 'Micro.blog'
  }
  switch (postType) {
    case 'note':
      return [
        { ...twitter, checked: true },
        { ...microblog, checked: true }
      ]
    case 'bookmark':
      return [
        { ...pinboard, checked: true }
      ]
    default:
      return [
        twitter,
        pinboard,
        microblog
      ]
  }
}

module.exports = syndicateTo
