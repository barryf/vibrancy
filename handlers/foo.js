const AWS = require('aws-sdk')
const dynamodb = require('serverless-dynamodb-client').doc

function create(item, table='posts') {
  dynamodb.put({
    TableName: table,
    Item: item
  })
}

module.exports.foo = async (event) => {
  create({ slug: 'foo', content: 'bar' })
  return {
    statusCode: 200,
    body: 'ok'
  }
}