const nunjucks = require('nunjucks')
const markdown = require('nunjucks-markdown')
const marked = require('marked')
const dynamodb = require('../lib/dynamodb')

const njkEnv = nunjucks.configure('views')
markdown.register(njkEnv, marked)

module.exports.process = async (event) => {
  const slug = event.path.replace(/^\//,'')
  console.log(`slug=${slug}`)
  const data = await dynamodb.get({
    TableName: 'posts',
    Key: { slug }
  }).promise()
  console.log(`data=${JSON.stringify(data)}`)
  const properties = data.Item.properties
  const html = nunjucks.render('post.njk', properties)
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: html
  }
}