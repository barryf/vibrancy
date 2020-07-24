const arc = require('@architect/functions')

exports.handler = async function http (req) {
  const data = await arc.tables()
  const body = arc.http.helpers.bodyParser(req)

  console.log(JSON.stringify(body))

  // TODO check secret matches
  delete body.secret

  // TODO store as file in github

  data.webmentions.put({ body })

  return {
    statusCode: 202
  }
}
