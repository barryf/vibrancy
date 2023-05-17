const { BskyAgent, RichText } = require('@atproto/api')
const { generateContent, appendSpecialCategories } = require('./text-helpers')

async function syndicate (post) {
  let content = generateContent(post)
  content += appendSpecialCategories(post)

  const identifier = process.env.BLUESKY_IDENTIFIER
  const password = process.env.BLUESKY_PASSWORD
  const agent = new BskyAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier, password })

  const richText = new RichText({ content })
  await richText.detectFacets(agent)

  const res = await agent.post({
    text: richText.text,
    facets: richText.facets
  })
  const id = res.uri.split('/').slice(-1)[0]
  // this is the current staging url and is likely to change when public
  const url = `https://staging.bsky.app/profile/${identifier}/post/${id}`
  return url
}

module.exports = { syndicate }
