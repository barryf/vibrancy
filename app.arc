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

@events
process-post
send-webmentions
write-github
fetch-context
notify-push

@tables
posts
  url *String
posts-public
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
contexts
  url *String
categories
  cat *String

@indexes
posts
  post-type *String
  published **String
posts
  channel *String
  published **String
posts-public
  post-type *String
  published **String
posts-public
  channel *String
  published **String
posts-public
  homepage *Number
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
