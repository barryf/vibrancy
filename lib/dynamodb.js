const AWS = require('aws-sdk')

let dynamodb
if (process.env.IS_LOCAL === 'true') {
  dynamodb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
} else {
  dynamodb = new AWS.DynamoDB.DocumentClient()
}

module.exports = dynamodb