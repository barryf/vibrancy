const dynamodb = require('../lib/dynamodb')

async function create(item, table) {
  await dynamodb.put({
    TableName: table,
    Item: item
  }).promise()
}

async function createPost(mf2) {
  console.log(mf2)
  await create({
    slug: mf2.slug[0],
    kind: mf2.kind[0],
    properties: mf2
  }, 'posts')
}

module.exports.process = async (event) => {
  const mf2 = event.mf2
  await createPost(mf2)
}