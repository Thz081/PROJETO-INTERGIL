FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-fund --no-audit
COPY server.js ./
COPY src ./src
RUN mkdir -p uploads && chown node:node uploads
USER node
CMD ["node", "server.js"]
