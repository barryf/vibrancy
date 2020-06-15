module.exports.list = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'list()',
        input: event,
      },
      null,
      2
    ),
  }
}