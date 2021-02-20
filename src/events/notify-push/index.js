const fetch = require('node-fetch')

async function send ({ message, title = null, url = null }) {
  const token = process.env.PUSHOVER_TOKEN
  const user = process.env.PUSHOVER_USER
  if (!token || !user) {
    console.log('Pushover ENV variable(s) missing.')
    return
  }
  const body = { token, user, message }
  if (title) body.title = title
  if (url) body.url = url

  const response = fetch('https://api.pushover.net/1/messages.json', {
    method: 'post',
    body
  })
  if (response.statusCode < 300) {
    console.error(response)
  }
}

exports.handler = async function subscribe (event) {
  const body = JSON.parse(event.Records[0].Sns.Message)
  await send(body)
}
