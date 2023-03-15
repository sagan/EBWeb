# cp config.production.js config.js
# docker build -t ebweb .
# docker run -d --name ebweb -v /root/files/appdata/ebweb/dicts:/usr/src/app/data-dicts -v /root/files/appdata/ebweb/config.js:/usr/src/app/config.js -v /root/files/appdata/ebweb/mod:/usr/src/app/dist/mod -p 127.0.0.1:3000:3000 ebweb

FROM node:16.14.0

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm i
# RUN npm i --registry=https://registry.npm.taobao.org
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
RUN apt-get update && apt-get install -y ffmpeg
COPY . .

RUN npm run build
RUN chmod a+x ./binary/ebclient

EXPOSE 3000

CMD [ "npm", "start" ]
