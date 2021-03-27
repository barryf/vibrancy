const arc = require('@architect/functions')

const header = `<!DOCTYPE html>
<html lang="en-gb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vibrancy Logs</title>
  <style>
    body {
      margin: 10px;
      font-family: monospace;
      line-height: 120%;
    }
    .info {
      color: blue;
    }
    .error {
      color: red;
    }
    .warn {
      color: orange;
    }
    details {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
`

const footer = `
</body>
</html>
`

function render (logs) {
  let body = ''
  for (const log of logs) {
    body += `
\n\n
<details>
  <summary>
    ${log.published} |
    <span class="${log.type.toLowerCase()}">${log.type.toUpperCase()}</span> |
    ${log.message}
  </summary>
  ID ${log.id}
  ${'description' in log && log.description ? '<pre>' + log.description + '</pre>' : ''}
</details>
`
  }
  return header + body + footer
}

async function getLogs () {
  const data = await arc.tables()
  const opts = {
    IndexName: 'log-published-index',
    ScanIndexForward: false,
    KeyConditionExpression: '#log = :log',
    ExpressionAttributeNames: {
      '#log': 'log'
    },
    ExpressionAttributeValues: {
      ':log': 'log'
    },
    Limit: 100
  }
  const logs = await data.logs.query(opts)
  return logs.Items
}

exports.handler = async function http (req) {
  const logs = await getLogs()
  const body = render(logs)
  return {
    statusCode: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'Content-Type': 'text/html; charset=utf-8'
    },
    body
  }
}
