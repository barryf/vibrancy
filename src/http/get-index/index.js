const arc = require('@architect/functions')
const nunjucks = require('nunjucks')
const markdown = require('nunjucks-markdown')
const marked = require('marked')

const njkEnv = nunjucks.configure('views')
markdown.register(njkEnv, marked)

async function renderIndex() {
  return "Index"
}

async function renderPost(slug) {
  const data = await arc.tables()
  const post = await data.posts.get({slug})
  if (post === undefined) return
  const properties = JSON.parse(post.properties)
  const html = nunjucks.render('post.njk', properties)
  return html
}

function send200(body) {
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: body
  }
}

function send404() {
  return {
    statusCode: 404,
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: '404 Not Found'
  }
}

exports.handler = async function http (req) {
  const slug = req.path.substr(1).replace('staging/','')
  switch (slug) {
    case 'favicon.ico':
      return send404()
    case '':
      body = await renderIndex()
      return send200(body)
    default:
      body = await renderPost(slug)
      if (body === undefined) {
        return send404()
      } else {
        return send200(body)
      }
  }
}