@app
vibrancy

@aws
region eu-west-2

@http
get /
get /micropub
post /micropub
post /process

@queues
download
ping

@tables
posts
  slug *String
tokens
  token *String

@indexes
posts
  post-type *String
posts
  published *String