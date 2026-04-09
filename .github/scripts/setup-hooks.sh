#!/usr/bin/env bash
set -e

git config core.hooksPath .githooks
chmod +x .githooks/pre-push

echo "Hooks Git activés"
