FROM node:22-alpine

RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production

RUN addgroup -S reelsfarm && adduser -S reelsfarm -G reelsfarm
RUN chown -R reelsfarm:reelsfarm ./

USER reelsfarm

EXPOSE 1337

CMD ["node","./dist/src/workerBootstrap.js"]
CMD ["npm","run","start"]