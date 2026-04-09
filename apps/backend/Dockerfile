FROM node:22-alpine AS base
WORKDIR /app

FROM base AS dev
RUN apk add --no-cache bash openssl
COPY scripts/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
RUN chmod +x /usr/local/bin/dev-entrypoint.sh
EXPOSE 3001
CMD ["dev-entrypoint.sh"]

FROM base AS builder
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]