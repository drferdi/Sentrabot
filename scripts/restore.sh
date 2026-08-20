#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:?usage: restore.sh backups/<stamp>}"
docker compose -f "$ROOT/infra/compose/docker-compose.yml" up -d postgres
until docker compose -f "$ROOT/infra/compose/docker-compose.yml" exec -T postgres pg_isready -U rakazo >/dev/null 2>&1; do
  sleep 1
done
docker compose -f "$ROOT/infra/compose/docker-compose.yml" exec -T postgres psql -U rakazo -d rakazo < "$SRC/rakazo.sql"
if [[ -f "$SRC/homes.tgz" ]]; then
  tar -xzf "$SRC/homes.tgz" -C "$ROOT"
fi
docker compose -f "$ROOT/infra/compose/docker-compose.yml" up -d
echo "Restore complete from $SRC"
