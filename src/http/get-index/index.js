exports.handler = async function http (req) {
  return {
    body: `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>    
        <h1>Vibrancy Micropub server</h1>
        <ul>
          <li>
            <a href="https://github.com/barryf/vibrancy">
              https://github.com/barryf/vibrancy
            </a>
          </li>
          <li>
            <a href="https://micropub.net">
              https://micropub.net
            </a>
          </li>
        </ul>
      </body>
    </html>
`
  }
}
