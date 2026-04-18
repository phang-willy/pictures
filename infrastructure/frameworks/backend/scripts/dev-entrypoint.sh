#!/bin/sh
set -e

NPM_FLAGS="--no-audit --no-fund --no-update-notifier --loglevel=error"
LOCK_HASH_FILE=".deps-lock-hash"

if [ -f package-lock.json ]; then
  CURRENT_HASH="$(sha256sum package-lock.json | awk '{print $1}')"
  STORED_HASH=""

  if [ -f "$LOCK_HASH_FILE" ]; then
    STORED_HASH="$(cat "$LOCK_HASH_FILE")"
  fi

  if [ ! -d node_modules ] ||
    [ "$CURRENT_HASH" != "$STORED_HASH" ] ||
    ( [ -d node_modules ] && [ package-lock.json -nt node_modules ] ); then
    npm ci $NPM_FLAGS
    printf "%s" "$CURRENT_HASH" > "$LOCK_HASH_FILE"
  fi
elif [ ! -d node_modules ]; then
  npm install $NPM_FLAGS
fi

npx prisma generate --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
exec npm run dev
