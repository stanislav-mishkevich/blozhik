#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL не задан. Установите DATABASE_URL, например DATABASE_URL=sqlite:./data/dev.sqlite"
  exit 1
fi

# Устанавливаем sqlx-cli если не установлен (опционально)
if ! command -v sqlx >/dev/null 2>&1; then
  echo "sqlx не найден, пытаюсь установить sqlx-cli..."
  cargo install sqlx-cli --no-default-features --features sqlite || true
fi

echo "Запуск миграций через sqlx migrate run against $DATABASE_URL"
export DATABASE_URL
sqlx migrate run
