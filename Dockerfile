FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm ci

COPY . .
RUN ls .



ENV NODE_ENV=production

EXPOSE 1337

CMD ["node","./dist/src/workerBootstrap.js"]
CMD ["npm","run","start"]