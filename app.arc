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
post /webmention

@queues
write-github
update-categories
send-webmentions
syndicate

@tables
posts
  url *String
tokens
  token *String
webmentions
  source *String
  target **String
categories-posts
  cat *String
  url **String
media
  url *String

@indexes
posts
  post-type *String
  published **String
posts
  channel *String
  published **String
webmentions
  target *String
  published **String
categories-posts
  cat *String
  published **String
categories-posts
  url *String
media
  type *String
  published **String
