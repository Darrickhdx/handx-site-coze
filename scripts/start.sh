#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

if [[ "${COZE_PROJECT_ENV:-}" == "PROD" ]]; then
    echo "Refusing COZE_PROJECT_ENV=PROD: this artifact is approved for local preview only." >&2
    exit 1
fi

PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_preview_data.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_static_assets.py
node tools/assert-local-preview-gate.mjs

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting local-only preview at http://127.0.0.1:${DEPLOY_RUN_PORT} ..."
    exec env NODE_ENV=production HOSTNAME=127.0.0.1 PORT=${DEPLOY_RUN_PORT} node dist/server.js
}

start_service
