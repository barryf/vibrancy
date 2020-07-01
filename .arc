@app
vibrancy-arc

@aws
region eu-west-2

@http
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
