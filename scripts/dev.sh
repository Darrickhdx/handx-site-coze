#!/bin/bash
set -Eeuo pipefail
PORT=5000
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-${PORT}}"


cd "${COZE_WORKSPACE_PATH}"

if [[ "${COZE_PROJECT_ENV:-}" == "PROD" ]]; then
    echo "Refusing COZE_PROJECT_ENV=PROD: this artifact is approved for local preview only." >&2
    exit 1
fi

PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_preview_data.py
node tools/assert-local-preview-gate.mjs

echo "Starting loopback-only HTTP service on port ${DEPLOY_RUN_PORT} for dev."
echo "If the port is already occupied, this command stops without terminating the existing process."

exec env HOSTNAME=127.0.0.1 PORT=${DEPLOY_RUN_PORT} pnpm tsx watch src/server.ts
