# EBWeb

## Build docker image

```
cp config.sample.js config.js # Modify your own config.js
docker build -t ebweb .
```

## Run

```
docker run -d --name ebweb \
  -v /root/files/appdata/ebweb/dicts:/usr/src/app/data-dicts \
  -v /root/files/appdata/ebweb/config.js:/usr/src/app/config.js \
  -v /root/files/appdata/ebweb/mod:/usr/src/app/dist/mod \
  -p 127.0.0.1:3000:3000 \
  ebweb
```
