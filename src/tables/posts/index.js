exports.handler = async function table (event) {
  console.log('tables-posts-event', JSON.stringify(event, null, 2))

  return true
}
