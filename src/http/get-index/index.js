const arc = require('@architect/functions')
const nunjucks = require('nunjucks')
const markdown = require('nunjucks-markdown')
const marked = require('marked')

const njkEnv = nunjucks.configure('views')
markdown.register(njkEnv, marked)

exports.handler = async function http (req) {
  if (req.path === '/favicon.ico') { return }
  const slug = req.path.substr(1).replace('staging/','')
  
  const data = await arc.tables()
  const post = await data.posts.get({slug})
  const properties = JSON.parse(post.properties)
  
  const html = nunjucks.render('post.njk', properties)

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: html
  }
}