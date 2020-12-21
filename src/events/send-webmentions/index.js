const arc = require('@architect/functions')

exports.handler = async function subscribe (event) {
  const body = JSON.parse(event.Records[0].Sns.Message)

}
