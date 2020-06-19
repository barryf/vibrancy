@app
vibrancy

@aws
region eu-west-2

@http
get /
get /:slug
post /process
post /micropub

@queues
download
upsert
ping

@tables
posts
  slug *String
