FROM node:16

MAINTAINER canwang<wangcan1213@gmail.com>

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 1608

CMD ["node", "app.js"]