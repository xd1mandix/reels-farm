FROM node:24-bookworm-slim

# FFmpeg нужен для обработки видео
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Сначала копируем package-файлы для кеширования Docker layer
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники проекта
COPY . .

ENV NODE_OPTIONS="--max-old-space-size=1850"

# Собираем Strapi Admin
# RUN npm run build

# Production
ENV NODE_ENV=production

EXPOSE 1337

CMD ["npm", "run", "start"]