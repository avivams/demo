FROM node:18-alpine AS build

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=test
RUN npm test

FROM node:18-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production
COPY --from=build /usr/src/app .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "./src/index.js"]
