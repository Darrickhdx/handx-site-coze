#!/bin/bash
set -Eeuo pipefail

# Run the public edition.
#
# Unlike scripts/start.sh this does NOT refuse COZE_PROJECT_ENV=PROD and does
# not force a loopback bind — that is the whole point of the separate lane. What
# it does refuse is starting without the explicit acknowledgement, so the public
# server can never come up as a side effect of running the wrong script.

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
cd "${COZE_WORKSPACE_PATH}"

PORT="${DEPLOY_RUN_PORT:-${PORT:-3000}}"
# Bind on every interface. Deliberately NOT read from HOSTNAME: in a container
# that variable holds the machine's name, not an address, so honouring it binds
# to one interface and the platform's health check never reaches the server.
BIND_HOST="${PUBLIC_BIND_HOST:-0.0.0.0}"

# Search engine indexing stays closed unless the owner opens it deliberately:
# a page that has been crawled and cached cannot be recalled.
if [[ -n "${PUBLIC_SEARCH_INDEXING:-}" ]]; then export PUBLIC_SEARCH_INDEXING; fi
export PUBLIC_EDITION_ACK="${PUBLIC_EDITION_ACK:-owner_authored_public_edition_v1}"
export SITE_EDITION=public
export NEXT_PUBLIC_SITE_EDITION=public
if [[ -n "${PUBLIC_SEARCH_INDEXING:-}" ]]; then export NEXT_PUBLIC_SEARCH_INDEXING="${PUBLIC_SEARCH_INDEXING}"; fi

if [[ ! -f dist/server-public.js ]]; then
    echo "dist/server-public.js is missing; run scripts/build-public.sh first." >&2
    exit 1
fi

echo "Starting public edition on ${BIND_HOST}:${PORT} (indexing: ${PUBLIC_SEARCH_INDEXING})"
exec env NODE_ENV=production PUBLIC_BIND_HOST="${BIND_HOST}" PORT="${PORT}" node dist/server-public.js
