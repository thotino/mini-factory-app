FROM node:14-alpine

RUN apk add git

WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY . .

CMD  ["npm", "start"]