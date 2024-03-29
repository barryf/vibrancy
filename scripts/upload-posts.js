// read posts from local files and write to dynamodb instance
// usage: node upload-posts.js FULL_PATH_TO_CONTENT_DIR
// e.g. /Users/barryf/Dropbox/barryfrost.com/content/posts/

const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk')
const DynamoDB = new AWS.DynamoDB.DocumentClient()

const contentDir = process.argv[2]
const table = ''

function traverseDir (dir, files) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file)
    if (fs.lstatSync(fullPath).isDirectory()) {
      // console.log(fullPath)
      traverseDir(fullPath, files)
    } else if (fullPath.split('.').slice(-1)[0] === 'json') {
      // console.log(fullPath)
      files.push(fullPath)
    }
  })
}

const files = []
traverseDir(contentDir, files)

for (const file of files) {
  const raw = fs.readFileSync(path.join(file), 'utf8')
  const post = JSON.parse(raw)

  if (!('properties' in post)) break

  const url = file.replace(contentDir, '').replace(/\.json$/, '')
  const item = {
    url,
    channel: 'posts',
    type: post.type[0],
    'post-type': post['post-type'][0],
    published: post.properties.published[0],
    properties: post.properties
  }

  console.log(url)

  DynamoDB.put({
    TableName: table,
    Item: item
  }, (err) => {
    console.error(err)
  })
}
