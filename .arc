@app
vibrancy-arc

@aws
region eu-west-2

@http
get /
post /process
post /micropub

@queues
download
upload
ping

@tables
posts
  slug *String

@indexes
posts
  published *String
  kind *String
