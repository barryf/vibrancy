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

@tables
posts
  slug *String
tokens
  token *String
webmentions
  source *String

@indexes
posts
  post-type *String
  published **String
webmentions
  target *String
