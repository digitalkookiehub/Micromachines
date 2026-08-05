#!/usr/bin/env bash
# Push the local working tree to the VPS. Run from the repo root:
#   bash deploy/sync.sh [user@host] [remote-dir]
#
# Uses tar over SSH so it works without rsync installed (e.g. Git Bash on Windows).
# .env is never transferred — it lives only on the server.
set -euo pipefail

REMOTE="${1:-deploy@69.62.77.175}"
REMOTE_DIR="${2:-/opt/micromachines}"

cd "$(dirname "$0")/.."

echo "==> Syncing $(pwd) -> $REMOTE:$REMOTE_DIR"

ssh "$REMOTE" "mkdir -p '$REMOTE_DIR'"

tar czf - \
  --exclude='./.git' \
  --exclude='./.env' \
  --exclude='./backend/.env' \
  --exclude='./frontend/.env' \
  --exclude='./frontend/node_modules' \
  --exclude='./frontend/dist' \
  --exclude='./node_modules' \
  --exclude='*__pycache__*' \
  --exclude='./.ruff_cache' \
  --exclude='./.pytest_cache' \
  --exclude='./.venv' \
  --exclude='./screenshot' \
  . | ssh "$REMOTE" "tar xzf - -C '$REMOTE_DIR'"

echo "==> Sync complete"
