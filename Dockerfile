FROM node:22-alpine

RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production

EXPOSE 1337

CMD ["node","./dist/src/workerBootstrap.js"]
CMD ["npm","run","start"]