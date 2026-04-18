#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

git config core.hooksPath .githooks

for hook in .githooks/*; do
  if [[ -f "$hook" ]] && [[ ! "$hook" =~ \.(md|txt)$ ]]; then
    chmod +x "$hook"
  fi
done

echo "Hooks Git activés (core.hooksPath=.githooks)"
echo "  - commit-msg : format Conventional Commits (voir .github/workflows/commit-message.yml)"
echo "  - pre-push   : commits signés (SKIP_SIGNED_COMMITS=1 pour désactiver en local)"
