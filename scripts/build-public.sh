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

# Only verifiers whose inputs live inside the repository can run here. The
# build host has the repository and nothing else: verify_graph_wiki_data reads
# the research corpus and novel_edition_contract reads the book source tree,
# both of which exist only on the author's machine. They stay in the workbench
# chain (scripts/build.sh, pnpm validate), which is where those inputs are.
echo "Verifying generated data contracts..."
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_preview_data.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_novel_assets.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_static_assets.py
pnpm exec tsx tools/verify-evidence-paths.ts
pnpm exec tsx tools/verify-people-dossiers.ts
pnpm exec tsx tools/verify-rights-passports.ts
pnpm exec tsx tools/verify-site-status.ts

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
