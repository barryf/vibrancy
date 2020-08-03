const arc = require('@architect/functions')

async function startup () {
  const data = await arc.tables()
  const posts = [
    {
      type: 'h-entry',
      url: '2020/07/foo',
      published: '2020-07-09T16:17:00',
      'post-type': 'note',
      visibility: 'public',
      content: `Something

\`\`\`javascript
const foo = "bar"
function baz (a, b) {
  let c = a
}
\`\`\`
`,
      category: ['via-twitter']
    },
    {
      type: 'h-entry',
      url: '2020/03/this-weekend-s-indiewebcamp-in-london',
      'post-type': 'note',
      content: "This weekend's [IndieWebCamp in London](https://2020.indieweb.org/london) has sensibly been switched to online-only because of the current health concerns. \r\n\r\nA big well done to the organisers, [Cheuk](https://cheuk.dev/), [Calum](https://calumryan.com/) and [Ana](https://ohhelloana.blog/), for their initial attempts to keep it going and then swiftly reconfiguring for an online event. Communication with attendees during the week has been exemplary. \r\n\r\nI'm very much looking forward to joining tomorrow's sessions from the comfort and safety of my home office.",
      updated: '2020-03-14T14:41:35Z',
      category: [
        'indieweb',
        'indiewebcamp',
        'london',
        'health',
        'iwclondon'
      ],
      published: '2020-03-13T17:11:06Z',
      visibility: 'public'
    },
    {
      type: 'h-entry',
      url: '2016/12/micropublish-2',
      name: 'Micropublish 2',
      content: {
        html: "<div>Today I pushed a rebuild of my <a href=\"https://micropub.net\">Micropub</a> client, Micropublish, live to <a href=\"https://micropublish.net\">https://micropublish.net</a>. The <a href=\"https://github.com/barryf/micropublish\">source</a> is on GitHub.&nbsp;</div><div><br></div><div>I've squeezed it out just before the end of 2016 so that I meet my <a href=\"https://barryfrost.com/2016/12/my-2017-01-01-indieweb-commitment\">IndieWeb commitment</a>. For the first time I'm now able to edit posts on this site and delete (or undelete) them if needed.&nbsp;</div><div><br></div><div>There are a couple of things I want to improve, but it's ready for use. If you have a compatible site I'd welcome you to kick the tyres and let me know how you get on.</div>"
      },
      category: [
        'indieweb',
        'indiewebcamp',
        'micropub',
        'micropublish'
      ],
      published:
        '2016-12-31T18:11:16Z',
      'post-type': 'article'
    }
  ]
  posts.forEach(async post => {
    await data.posts.put(post)
  })

  const webmentions = [
    {
      source: 'http://rhiaro.co.uk/2015/11/1446953889',
      target: 'http://localhost:4444/2020/07/foo',
      post: {
        type: 'entry',
        author: {
          name: 'Amy Guy',
          photo: 'http://webmention.io/avatar/rhiaro.co.uk/829d3f6e7083d7ee8bd7b20363da84d88ce5b4ce094f78fd1b27d8d3dc42560e.png',
          url: 'http://rhiaro.co.uk/about#me'
        },
        url: 'http://rhiaro.co.uk/2015/11/1446953889',
        published: '2015-11-08T03:38:09+00:00',
        name: 'repost of http://aaronparecki.com/notes/2015/11/07/4/indiewebcamp',
        'repost-of': 'http://aaronparecki.com/notes/2015/11/07/4/indiewebcamp',
        'wm-property': 'repost-of'
      }
    }
  ]
  webmentions.forEach(async wm => {
    await data.webmentions.put(wm)
  })

  const categories = [
    { type: 'tag', category: 'indieweb' },
    { type: 'tag', category: 'indiewebcamp' },
    { type: 'tag', category: 'micropub' },
    { type: 'tag', category: 'micropublish' },
    { type: 'tag', category: 'london' },
    { type: 'tag', category: 'health' },
    { type: 'tag', category: 'iwclondon' },
    { type: 'contact', category: 'https://barryfrost.com' },
    { type: 'contact', category: 'https://calumryan.com' }
  ]
  categories.forEach(async cat => {
    await data.categories.put(cat)
  })
}

module.exports = startup
