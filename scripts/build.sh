#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Regenerating audited local-preview data..."
PYTHONDONTWRITEBYTECODE=1 python3 tools/build_preview_data.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_preview_data.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/build_graph_wiki_data.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_graph_wiki_data.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_novel_assets.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_static_assets.py
pnpm exec tsx tools/verify-topics-media.ts
pnpm exec tsx tools/verify-article-rights.ts
node tools/assert-local-preview-gate.mjs
node tools/verify-handx-release.mjs

echo "Installing dependencies..."
pnpm install --frozen-lockfile --prefer-offline --reporter=append-only

echo "Building the Next.js project..."
pnpm next build

echo "Bundling server with tsup..."
pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

echo "Local-preview build completed successfully; deployment remains blocked."
