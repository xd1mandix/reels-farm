FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . .

RUN npm run build

# ------------------------

FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY --from=builder /app ./

ENV NODE_ENV=production

RUN addgroup -S strapi && adduser -S strapi -G strapi
RUN chown -R strapi:strapi /app

USER strapi

EXPOSE 1337

CMD ["npm","run","start"]