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
categories-posts
  cat *String
  url **String

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
  cat *String
  published **String
categories-posts
  url *String
