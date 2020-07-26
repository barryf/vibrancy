@app
vibrancy

@aws
region eu-west-2

@http
get /
get /micropub
get /media
post /micropub
post /media
post /process
post /webmention

@queues
download
ping

@scheduled
categories rate(1 day)

@tables
posts
  slug *String
tokens
  token *String
webmentions
  source *String
categories
  type *String
  category **String

@indexes
posts
  post-type *String
  published **String
webmentions
  target *String
