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
update-categories
send-webmentions

@tables
posts
  url *String
  stream true
tokens
  token *String
webmentions
  source *String
categories
  type *String
  category **String
categories-posts
  cat *String

@indexes
posts
  post-type *String
  published **String
posts
  type *String
  published **String
webmentions
  target *String
categories-posts
  url *String
categories-posts
  cat *String
  published **String