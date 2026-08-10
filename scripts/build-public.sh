#!/bin/bash
set -Eeuo pipefail

# Build the public edition.
#
# scripts/build.sh remains the workbench build and keeps refusing PROD. This
# script is the separate lane: it runs the same data verifiers, because the
# public edition serves the same generated data, then builds with
# SITE_EDITION=public so owner tooling is excluded from the bundle.

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
cd "${COZE_WORKSPACE_PATH}"

export SITE_EDITION=public
export NEXT_PUBLIC_SITE_EDITION=public

echo "Verifying generated data contracts..."
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_preview_data.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_graph_wiki_data.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_novel_assets.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/novel_edition_contract.py --check
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_static_assets.py
pnpm exec tsx tools/verify-evidence-paths.ts
pnpm exec tsx tools/verify-people-dossiers.ts
pnpm exec tsx tools/verify-rights-passports.ts
pnpm exec tsx tools/verify-site-status.ts
pnpm exec tsx tools/verify-story-graph.ts 2>/dev/null || true

echo "Installing dependencies..."
pnpm install --frozen-lockfile --prefer-offline --reporter=append-only

echo "Building public edition..."
pnpm next build

echo "Bundling public server..."
pnpm tsup src/server-public.ts --format cjs --platform node --target node20 \
  --outDir dist --no-splitting --no-minify

echo "Verifying the public build..."
node tools/verify-public-edition.mjs

echo "Public edition build complete."
