const fetch = require('node-fetch')
const matter = require('gray-matter')
const dynamodb = require('../lib/dynamodb')

const baseUrl = "https://raw.githubusercontent.com/barryf/content/transform-fm-md/"

// async function scan(table='posts') {
//   return await dynamodb.scan({ TableName: table }).promise()
// }

// sls invoke local -f download --data '{ "path": "2018/04/leaving-venntro" }'

module.exports.process = async (event) => {
  const slug = event.path
  const response = await fetch(`${baseUrl}${slug}.md`)
  const text = await response.text()
  const post = matter(text)
  
  let mf2 = post.data
  mf2.content = [post.content]

  console.log(`mf2=${JSON.stringify(mf2,null,2)}`)
    
  //const posts = await scan()
}