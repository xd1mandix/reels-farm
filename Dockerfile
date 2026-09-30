FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S reelsfarm && adduser -S reelsfarm -G reelsfarm
RUN chown -R reelsfarm:reelsfarm /app

USER reelsfarm

EXPOSE 1337

CMD ["node","/app/dist/src/workerBootstrap.js"]
CMD ["npm","run","start"]