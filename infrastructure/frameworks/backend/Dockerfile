FROM node:24-alpine

WORKDIR /workspace/infrastructure/frameworks/backend

ENV NODE_ENV=development
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NODE_PATH=/workspace/infrastructure/frameworks/backend/node_modules

RUN apk add --no-cache libc6-compat bash
COPY scripts/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/dev-entrypoint.sh \
  && chmod +x /usr/local/bin/dev-entrypoint.sh

EXPOSE 3001

CMD ["/usr/local/bin/dev-entrypoint.sh"]
