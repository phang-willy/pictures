# Build depuis la racine du dépôt : `docker build -f infrastructure/frameworks/frontend/next/Dockerfile .`
FROM node:24-alpine AS base
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

FROM base AS dev
RUN apk add --no-cache libc6-compat bash
COPY infrastructure/frameworks/frontend/next/scripts/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/dev-entrypoint.sh
RUN chmod +x /usr/local/bin/dev-entrypoint.sh
WORKDIR /workspace/infrastructure/frameworks/frontend/next
EXPOSE 3000
CMD ["/usr/local/bin/dev-entrypoint.sh"]

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /build
# Monorepo (application/, shared/, etc.) : exclusions via `.dockerignore` à la racine du dépôt
COPY . .
WORKDIR /build/infrastructure/frameworks/frontend/next
RUN npm ci && npm run build

FROM base AS prod
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat
COPY --from=builder /build/infrastructure/frameworks/frontend/next/.next/standalone ./
COPY --from=builder /build/infrastructure/frameworks/frontend/next/.next/static ./.next/static
COPY --from=builder /build/infrastructure/frameworks/frontend/next/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
