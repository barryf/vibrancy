const arc = require('@architect/functions')

async function contact (filter = '') {
  if (filter) {
    filter = filter.toLowerCase().replace(/[^a-z0-9-]/, '')
  }
  const data = await arc.tables()
  const results = await data.contacts.scan({})
  const contacts = results.Items.map(c => {
    if (filter) {
      if (c.nickname.startsWith(filter)) {
        return c
      } else {
        return null
      }
    } else {
      return c
    }
  }).filter((el) => el != null) // remove nulls
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .sort()
  return contacts
}

module.exports = contact
