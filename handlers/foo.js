const dynamodb = require('../lib/dynamodb')

async function create(item, table='posts') {
  await dynamodb.put({
    TableName: table,
    Item: item
  }).promise()
}

async function scan(table='posts') {
  return await dynamodb.scan({ TableName: table }).promise()
}

module.exports.foo = async (event) => {
  await create({ slug: 'bar', content: 'baz' })
  const posts = await scan()
  return {
    statusCode: 200,
    body: posts.Items
  }
}