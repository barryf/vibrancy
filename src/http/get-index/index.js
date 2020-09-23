exports.handler = async function http (req) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: 'Vibrancy'
  }
}
