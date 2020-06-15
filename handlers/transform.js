const nunjucks = require('nunjucks')
const markdown = require('nunjucks-markdown')
const marked = require('marked')
const fetch = require('node-fetch')
const matter = require('gray-matter')

const njkEnv = nunjucks.configure('views')
markdown.register(njkEnv, marked)

const baseUrl = "https://raw.githubusercontent.com/barryf/content/transform-fm-md/"

module.exports.transform = async (event) => {
  const slug = event.path
  const response = await fetch(`${baseUrl}${slug}.md`)
  const text = await response.text()
  const post = matter(text)
  const html = nunjucks.render('post.njk', post)
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: html
  }
}