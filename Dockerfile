FROM node:14-alpine

RUN apk add git

WORKDIR /app

COPY ./package*.json ./

RUN npm install

COPY . .

ENV PORT 1400
EXPOSE 1400

CMD  ["npm", "start"]