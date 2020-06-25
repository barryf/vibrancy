const arc = require('@architect/functions')

const create = async function (body) {
  const data = await arc.tables()
  const post = {
    slug: body.properties['mp-slug'][0],
    published: Date.now,
    kind: 'note', // deriveKind()
    properties: JSON.stringify(body.properties)
  }
  await data.posts.put(post)
}

exports.micropub = { create }
