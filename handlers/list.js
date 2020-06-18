const dynamodb = require('../lib/dynamodb')

module.exports.process = async (event) => {
  const posts = await dynamodb.scan({ TableName: 'posts' }).promise()
  const body = posts.Items
  return {
    statusCode: 200,
    body: body
  }
}