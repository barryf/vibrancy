# Vibrancy

Vibrancy is a Headless CMS and [Micropub][] endpoint that acts as the back-end to my personal website. It's built using the [Architect][] serverless framework in Node and must be deployed to AWS.

Content is served to authorised clients as [Microformats 2 JSON][mf2json]]. See the separate [barryfrost][] project for the [barryfrost.com][] front-end.

## Status

This project is currently under development and should be considered highly experimental and likely to change at any time. You're welcome to fork and hack on it but its primary purpose is to evolve based on my needs. Use at your own risk!

## Goals

- **Sub-second updates**. I'm impatient. I want near-instant updates without a rebuild cycle. My personal site has ~9K posts which even the fastest static site generators take over 10s to generate and then longer to deploy.
- **Learn serverless, AWS and Node.js**. I'm used to Ruby, monoliths and RDBMSs. This is an attempt to try new technologies, learn and work around limitations.
- **For me to have fun!** I acknowledge the architecture is completely over-engineered for a personal website, but this is my playground so ¯\\\_(ツ)\_/¯

## How it works

Vibrancy implements the Micropub server specification for posts to be created, updated, deleted and undeleted. Posts can also be read and queried via the API.

There is no admin system. Using a third party client like [Micropublish][] or [Quill][] I can log in (via [IndieAuth][]) and administer my content.

### Architecture

The Architect framework builds AWS infrastructure at

- `post-micropub`
  - Lambda

### Storage

All content is stored on GitHub in my `content` git repository. Posts are also maintained in DynamoDB tables for querying. Tables can be rebuilt from the repo if needed, but the canonical store is the git repo.

## Environment variables

```env
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
ME_URL
MEDIA_BUCKET
MEDIA_ENDPOINT_URL
MEDIA_URL
MICRO_BLOG_TOKEN
PINBOARD_AUTH_TOKEN
ROOT_URL
TOKEN_ENDPOINT
TWITTER_ACCESS_TOKEN
TWITTER_ACCESS_TOKEN_SECRET
TWITTER_ACCOUNT
TWITTER_CONSUMER_KEY
TWITTER_CONSUMER_SECRET
```

## FAQs

#### Q: Why Architect and not the Serverless Framework?

Because

#### Q: Did you try Hugo, Gatsby, Wordpress, etc.?

Nope

[architect]: https://arc.codes
[barryfrost]: https://github.com/barryf/barryfrost
[barryfrost.com]: https://barryfrost.com
[micropub]: https://micropub.net
[mf2json]: http://microformats.org/wiki/microformats2-json
[micropublish]: https://micropublish.net
[quill]: https://quill.p3k.io
[indieauth]: https://www.w3.org/TR/indieauth/
