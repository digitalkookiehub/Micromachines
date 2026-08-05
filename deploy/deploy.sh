#!/usr/bin/env bash
# Build, migrate and (re)start the production stack. Run from the app directory
# on the VPS, after .env exists:
#   bash deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "ERROR: .env is missing. Copy .env.production.example to .env and fill it in." >&2
  exit 1
fi

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "==> Building images"
$COMPOSE build

echo "==> Starting datastores"
$COMPOSE up -d db redis meilisearch

echo "==> Waiting for Postgres"
until $COMPOSE exec -T db pg_isready -U "$(grep -E '^DB_USER=' .env | cut -d= -f2-)" >/dev/null 2>&1; do
  sleep 2
done

echo "==> Running migrations"
$COMPOSE run --rm backend alembic upgrade head

echo "==> Starting application"
$COMPOSE up -d

echo "==> Pruning dangling images"
docker image prune -f >/dev/null

echo
$COMPOSE ps
echo
echo "==> Deploy complete: https://$(grep -E '^DOMAIN=' .env | cut -d= -f2-)"
