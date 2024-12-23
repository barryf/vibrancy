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
      try {
        let url = (typeof photo === 'string') ? photo : photo.value
        const starts = 'https://res.cloudinary.com/barryf/image/upload/'
        if (url.startsWith(starts)) {
          // Constrain both width and height for Bluesky
          url = url.replace(starts, `${starts}c_fit,w_1000,h_1000/`)
        }
        const alt = (typeof photo === 'string') ? '' : photo.alt
        
        console.log(`Fetching image from: ${url}`)
        const response = await fetch(url)
        if (!response.ok) {
          console.error(`Failed to fetch image: ${response.status} ${response.statusText}`)
          continue
        }

        // Get content type from response headers
        const contentType = response.headers.get('content-type')
        if (!contentType || !['image/jpeg', 'image/png'].includes(contentType.toLowerCase())) {
          console.error(`Unsupported image format: ${contentType}`)
          continue
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        console.log(`Uploading image to Bluesky (${contentType}, ${buffer.length} bytes)`)
        const { data } = await agent.uploadBlob(
          buffer,
          { encoding: contentType }
        )
        
        images.push({
          alt,
          image: data.blob
        })
        console.log('Image upload successful')
      } catch (error) {
        console.error('Error processing image:', error)
        continue
      }
    }
  }
  if (images.length) {
    richPost.embed = {
      $type: 'app.bsky.embed.images',
      images
    }
  }

  const response = await agent.post(richPost)
  if (!response.validationStatus === 'valid') {
    console.error('Error when syndicating to Bluesky', response)
    return
  }
  const id = response.uri.split('/').slice(-1)[0]
  const url = `https://bsky.app/profile/${identifier}/post/${id}`
  return url
}

module.exports = { syndicate }
