# Run with nginx-proxy

https://github.com/nginx-proxy/nginx-proxy/pull/1257

a modified nginx-proxy version with VIRTUAL_PATH support

docker pull christhomas/nginx-proxy

docker run -d --name nginx-proxy \
 --name nginx-proxy \
 --publish 80:80 \
 --publish 443:443 \
 --volume /etc/nginx/certs \
 --volume /root/files/appdata/nginx-proxy/conf.d:/etc/nginx/conf.d \
 --volume /root/files/appdata/nginx-proxy/log:/var/log/nginx \
 --volume /root/files/appdata/nginx-proxy/vhost.d:/etc/nginx/vhost.d \
 --volume /usr/share/nginx/html \
 --volume /var/run/docker.sock:/tmp/docker.sock:ro \
 christhomas/nginx-proxy:alpine

docker run --detach \
 --name nginx-proxy-letsencrypt \
 --volumes-from nginx-proxy \
 --volume /var/run/docker.sock:/var/run/docker.sock:ro \
 --env "DEFAULT_EMAIL=example@gmail.com" \
 jrcs/letsencrypt-nginx-proxy-companion

docker run -d --name ebweb \
 -v /root/files/appdata/ebweb/dicts:/usr/src/app/data-dicts \
 -v /root/files/appdata/ebweb/config.js:/usr/src/app/config.js \
 -v /root/files/appdata/ebweb/mod:/usr/src/app/dist/mod \
 --env "VIRTUAL_HOST=sakura-paris.org" \
 --env "VIRTUAL_PORT=3000" \
 --env "VIRTUAL_PATH=/dict/" \
 --env "LETSENCRYPT_HOST=sakura-paris.org" \
 --env "LETSENCRYPT_EMAIL=example@gmail.com" \
 ebweb

nginx-proxy log rotation

```
0 0 * * * mv /root/files/appdata/nginx-proxy/log/sakura-paris.org.access.log /root/files/appdata/nginx-proxy/log/sakura-paris.org.$(date +%F).access.log &&  docker exec -it nginx-proxy nginx -s reload
```

docker exec nginx-proxy "ls \$(cat /run/nginx.pid)"

# Test without CDN

curl -I -k --resolve sakura-paris.org:443:127.0.0.1 https://sakura-paris.org/dict/
