# Cloud render worker. Build from the getnearme_Site repo root:
#   docker build -f worker/Dockerfile -t gnm-render-worker .
FROM node:22-bookworm-slim

# Chromium (for puppeteer-core) + ffmpeg + fonts for text rendering.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium ffmpeg fonts-liberation fonts-noto-core fontconfig ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    NODE_ENV=production

WORKDIR /app

# Install deps first (layer cache).
COPY worker/package.json ./package.json
RUN npm install --omit=dev

# App: the locked render templates + the worker + the brand logo.
COPY src/lib/social/video-stories ./src/lib/social/video-stories
COPY worker/render-worker.mjs ./worker/render-worker.mjs
COPY public/logo_blu_nero.svg ./worker/assets/logo_blu_nero.svg

# One-shot: render all pending video topics, then exit. Schedule via the host
# cron (e.g. */10 * * * *  docker run --rm --env-file .env gnm-render-worker).
CMD ["node", "worker/render-worker.mjs"]
