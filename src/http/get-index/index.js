const arc = require('@architect/functions')
const nunjucks = require('nunjucks')
const markdown = require('nunjucks-markdown')
const marked = require('marked')

const njkEnv = nunjucks.configure('views')
markdown.register(njkEnv, marked)

async function renderIndex () {
  const css = arc.static('/main.css')
  const data = await arc.tables()
  const result = await data.posts.scan({ TableName: 'posts' })
  const posts = result.Items.map(item => JSON.parse(item.properties))
  const html = nunjucks.render('homepage.njk', { posts, css })
  return html
}

async function renderKind (kind) {
  const css = arc.static('/main.css')
  const data = await arc.tables()
  const result = await data.posts.scan({
    TableName: 'posts',
    FilterExpression: 'kind = :kind',
    ExpressionAttributeValues: {
      ':kind': kind
    }
  })
  const posts = result.Items.map(item => JSON.parse(item.properties))
  const html = nunjucks.render('homepage.njk', { posts, css })
  return html
}

async function renderPost (slug) {
  const css = arc.static('/main.css')
  const data = await arc.tables()
  const postData = await data.posts.get({ slug })
  if (postData === undefined) return
  const post = { properties: JSON.parse(postData.properties) }
  const html = nunjucks.render('post.njk', { post, css })
  return html
}

function send200 (body) {
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: body
  }
}

function send404 () {
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
  const slug = req.path.substr(1).replace('staging/', '')
  let body
  switch (slug) {
    case 'favicon.ico':
      return
    case 'articles':
      body = await renderKind('article')
      return send200(body)
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
