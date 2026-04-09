FROM node:22-alpine AS base
WORKDIR /app

FROM base AS dev
RUN apk add --no-cache bash openssl
COPY apps/backend/scripts/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/dev-entrypoint.sh
RUN chmod +x /usr/local/bin/dev-entrypoint.sh
EXPOSE 3001
CMD ["/usr/local/bin/dev-entrypoint.sh"]

FROM base AS builder
RUN apk add --no-cache openssl
COPY apps/backend/package*.json ./
COPY apps/backend/prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY apps/backend/ ./
COPY shared /shared
RUN npm run build

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY apps/backend/package*.json ./
RUN npm ci --omit=dev
COPY apps/backend/prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
