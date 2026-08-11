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

# Unpublished routes are moved out of src/app for the duration of the build and
# restored by the trap below. The allow-list stops them answering; this stops
# them being compiled, so their HTML and chunks are not in the deployment at all.
# The trap covers ordinary failures and Ctrl-C; --exclude also restores first,
# so even a killed build cannot leave the tree short of its workbench routes.
restore_routes() { node tools/stage-public-routes.mjs --restore || true; }
trap restore_routes EXIT INT TERM

export SITE_EDITION=public
export NEXT_PUBLIC_SITE_EDITION=public
# Indexing is decided at build time as well as at runtime, because robots.txt,
# the sitemap and the page metadata are all baked into the build. The decision
# itself lives in src/data/public-edition.json; only forward an override when one
# was actually given, otherwise this would shadow the committed value.
if [[ -n "${PUBLIC_SEARCH_INDEXING:-}" ]]; then
    export PUBLIC_SEARCH_INDEXING
    export NEXT_PUBLIC_SEARCH_INDEXING="${PUBLIC_SEARCH_INDEXING}"
fi

# Dependencies first: the verifiers below run through tsx, which does not exist
# until node_modules does. On a fresh checkout — which is exactly what the build
# host has — running them earlier fails before it can check anything.
echo "Installing dependencies..."
pnpm install --frozen-lockfile --prefer-offline --reporter=append-only

# Only verifiers whose inputs live inside the repository can run here. The build
# host has the repository and nothing else, so these are excluded and stay in the
# workbench chain where their inputs exist:
#   verify_preview_data      imports tools/public_generation_authority from the
#                            parent workspace, two levels above this repo
#   verify_graph_wiki_data   reads the research corpus under 知识图谱
#   novel_edition_contract   reads the book source tree under 成书/出版版
echo "Verifying generated data contracts..."
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_novel_assets.py
PYTHONDONTWRITEBYTECODE=1 python3 tools/verify_static_assets.py
pnpm exec tsx tools/verify-evidence-paths.ts
pnpm exec tsx tools/verify-people-dossiers.ts
pnpm exec tsx tools/verify-rights-passports.ts
pnpm exec tsx tools/verify-site-status.ts
node tools/build-public-atlas.mjs --check
pnpm exec tsx tools/build-public-story.ts --check
pnpm exec tsx tools/verify-client-payload.ts

echo "Excluding unpublished routes from the build..."
node tools/stage-public-routes.mjs --exclude

echo "Building public edition..."
pnpm next build

echo "Bundling public server..."
pnpm tsup src/server-public.ts --format cjs --platform node --target node20 \
  --outDir dist --no-splitting --no-minify

echo "Verifying the public build..."
# After the build, because it reads the citations off the built pages. If it
# reports staleness, regenerate with `pnpm cited:build`, commit, and build
# again: the allow-list is committed data, not a build-time discovery.
pnpm exec tsx tools/build-cited-sources.ts --check
node tools/verify-public-edition.mjs
pnpm exec tsx tools/verify-public-bundle.ts

echo "Public edition build complete."
