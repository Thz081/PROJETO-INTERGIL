FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg libheif-examples \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev --no-fund --no-audit
COPY server.js ./
COPY src ./src
RUN mkdir -p uploads momentos/entrada momentos/saida && chown -R node:node uploads momentos
USER node
CMD ["node", "server.js"]
