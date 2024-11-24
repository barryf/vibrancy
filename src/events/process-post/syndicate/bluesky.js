const { BskyAgent, RichText } = require('@atproto/api')
const { generateContent, appendSpecialCategories } = require('./text-helpers')

async function syndicate (post) {
  let content = generateContent(post)
  content += appendSpecialCategories(post)

  const identifier = process.env.BLUESKY_IDENTIFIER
  const password = process.env.BLUESKY_PASSWORD
  const agent = new BskyAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier, password })

  const richText = new RichText({ text: content })
  await richText.detectFacets(agent)
  const richPost = {
    text: richText.text,
    facets: richText.facets
  }

  const images = []
  if ('photo' in post.properties) {
    const photos = post.properties.photo.slice(0, 4) // max 4
    for (const photo of photos) {
      let url = (typeof photo === 'string') ? photo : photo.value
      const starts = 'https://res.cloudinary.com/barryf/image/upload/'
      if (url.startsWith(starts)) {
        url = url.replace(starts, `${starts}h_768/`)
      }
      const alt = (typeof photo === 'string') ? '' : photo.alt
      const response = await fetch(url)
      if (!response.ok) continue
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const { data } = await agent.uploadBlob(
        buffer,
        { encoding: 'image/jpeg' }
      )
      images.push({
        alt,
        image: data.blob
      })
    }
  }
  if (images.length) {
    richPost.embed = {
      $type: 'app.bsky.embed.images',
      images
    }
  }

  const response = await agent.post(richPost)
  if (!response.ok) return
  const id = response.uri.split('/').slice(-1)[0]
  const url = `https://bsky.app/profile/${identifier}/post/${id}`
  return url
}

module.exports = { syndicate }
