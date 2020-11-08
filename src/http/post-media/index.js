const cloudinary = require('cloudinary').v2
const arc = require('@architect/functions')
const parser = require('lambda-multipart-parser')
const { requireScopes } = require('@architect/shared/auth')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

function dateFilePath (published) {
  const yyyy = published.getFullYear().toString()
  const m = (published.getMonth() + 1).toString()
  const mm = m.length === 1 ? `0${m}` : m
  return `${yyyy}/${mm}/`
}

async function upload (file, contentType) {
  const publishedDate = new Date()
  const key = dateFilePath(publishedDate) +
    Math.random().toString(36).substring(2, 15)
  const dataUri = `data:${contentType};base64,${file}`
  const result = await cloudinary.uploader.upload(dataUri, { public_id: key })
  return {
    url: result.secure_url,
    type: result.resource_type,
    published: publishedDate.toISOString(),
    filePath: `${key}.${result.format}`
  }
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)
  const data = await arc.tables()

  const acceptedScopes = ['create', 'media']
  const authResponse = await requireScopes(acceptedScopes, req.headers, body)
  if (authResponse.statusCode >= 400) return authResponse

  const result = await parser.parse(req)
  const buffer = result.files[0].content
  const file = Buffer.from(buffer).toString('base64')
  const contentType = result.files[0].contentType
  const media = await upload(file, contentType)

  await data.media.put(media)

  await arc.events.publish({
    name: 'write-github',
    payload: {
      folder: 'files',
      url: media.url,
      filePath: media.filePath
    }
  })

  return {
    headers: {
      location: media.url,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      url: media.url
    }),
    statusCode: 201
  }
}
