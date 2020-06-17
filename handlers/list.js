const dynamodb = require('../lib/dynamodb')

module.exports.list = async (event) => {
  const posts = await dynamodb.scan({ TableName: 'posts' }).promise()
  const body = JSON.stringify(posts.Items)
  return {
    statusCode: 200,
    body: body
  }
}