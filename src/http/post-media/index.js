const aws = require('aws-sdk')
const arc = require('@architect/functions')

async function upload (body) {
  return 'https://www.bbc.co.uk/'
}

exports.handler = async function http (req) {
  const body = arc.http.helpers.bodyParser(req)

  const url = await upload(body)
  return {
    headers: {
      Location: url
    },
    statusCode: 201
  }
}
