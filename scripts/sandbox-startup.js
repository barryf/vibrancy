const arc = require('@architect/functions')

async function startup () {
  const data = await arc.tables()
  const posts = [
    {
      slug: '2020/07/foo',
      published: '2020-07-09T16:17:00',
      'post-type': 'note',
      content: 'Foo'
    },
    {
      slug: '2020/03/this-weekend-s-indiewebcamp-in-london',
      'post-type': 'note',
      content: "This weekend's [IndieWebCamp in London](https://2020.indieweb.org/london) has sensibly been switched to online-only because of the current health concerns. \r\n\r\nA big well done to the organisers, [Cheuk](https://cheuk.dev/), [Calum](https://calumryan.com/) and [Ana](https://ohhelloana.blog/), for their initial attempts to keep it going and then swiftly reconfiguring for an online event. Communication with attendees during the week has been exemplary. \r\n\r\nI'm very much looking forward to joining tomorrow's sessions from the comfort and safety of my home office.",
      updated: '2020-03-14T14:41:35Z',
      category: [
        'indiewebcamp',
        'london',
        'health',
        'iwclondon'
      ],
      published: '2020-03-13T17:11:06Z'
    }
  ]
  posts.forEach(async post => {
    await data.posts.put(post)
  })
}
module.exports = startup
