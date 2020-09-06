const AWS = require('aws-sdk')
const arc = require('@architect/functions')
// const { auth } = require('@architect/shared/auth')

const s3 = new AWS.S3({
  // endpoint: new AWS.Endpoint(process.env.S3_ENDPOINT)
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

function dateFilePath (published) {
  const yyyy = published.getFullYear().toString()
  const m = (published.getMonth() + 1).toString()
  const mm = m.length === 1 ? `0${m}` : m
  return `${yyyy}/${mm}/`
}

async function upload (file, filename) {
  const ext = filename.split('.').slice(-1)[0]
  const published = new Date()
  const key = dateFilePath(published) +
    Math.random().toString(36).substring(2, 15)
  s3.upload({
    Bucket: process.env.MEDIA_BUCKET,
    ACL: 'public-read',
    Key: key,
    Body: file
  }, function (err, data) {
    if (err) {
      console.error(err)
    } else if (data) {
      console.log('location', data.Location)
      return {
        type: 'image', // TODO: other file types?
        url: `${process.env.MEDIA_URL}${key}.${ext}`,
        published
      }
    }
  })
}

exports.handler = async function http (req) {
  const data = await arc.tables()
  const body = arc.http.helpers.bodyParser(req)

  // const authResponse = await auth.requireScope('media', req.headers, body)
  // if (authResponse.statusCode >= 400) return authResponse

  const media = await upload(body)

  await data.media.put(media)

  return {
    headers: {
      Location: media.url
    },
    statusCode: 201
  }
}
