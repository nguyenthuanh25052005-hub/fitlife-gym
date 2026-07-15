FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
# Docker Level 2 uses PostgreSQL, so the optional native SQLite dependency is
# deliberately omitted from this production image.
RUN npm ci --omit=dev --omit=optional && npm cache clean --force
COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 5000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
