FROM node:22-alpine AS base
WORKDIR /app
RUN wget -qO /tmp/npm.tgz https://registry.npmjs.org/npm/-/npm-11.12.1.tgz \
  && rm -rf /usr/local/lib/node_modules/npm \
  && mkdir -p /usr/local/lib/node_modules \
  && tar -xzf /tmp/npm.tgz -C /usr/local/lib/node_modules \
  && mv /usr/local/lib/node_modules/package /usr/local/lib/node_modules/npm \
  && ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
  && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
  && rm -f /tmp/npm.tgz \
  && npm -v

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
