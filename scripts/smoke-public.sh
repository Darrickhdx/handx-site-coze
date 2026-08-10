#!/bin/bash
set -Eeuo pipefail

# Prove the public edition behaves on a live server.
#
# Static checks cannot tell whether a guarded branch is reachable, so this boots
# the real bundle and asks it. It also runs the negative cases: the public server
# must refuse to start without the acknowledgement, and the workbench server must
# still refuse a production environment.

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
cd "${COZE_WORKSPACE_PATH}"

PORT=$(( (RANDOM % 2000) + 43000 ))
BASE="http://127.0.0.1:${PORT}"
SERVER_PID=""

cleanup() {
    if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
        kill "${SERVER_PID}" 2>/dev/null || true
        wait "${SERVER_PID}" 2>/dev/null || true
    fi
}
trap cleanup EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }

if [[ ! -f dist/server-public.js ]]; then
    fail "dist/server-public.js is missing; run scripts/build-public.sh first."
fi

# Negative case: no acknowledgement means no public server.
if env -u PUBLIC_EDITION_ACK NODE_ENV=production HOSTNAME=127.0.0.1 \
     PORT=$((PORT + 1)) node dist/server-public.js >/dev/null 2>&1; then
    fail "public server started without PUBLIC_EDITION_ACK"
fi
echo "ok: refuses to start without an explicit acknowledgement"

# Negative case: the workbench lane must still refuse production.
if COZE_PROJECT_ENV=PROD DEPLOY_RUN_PORT=$((PORT + 2)) bash ./scripts/start.sh >/dev/null 2>&1; then
    fail "workbench start.sh accepted COZE_PROJECT_ENV=PROD"
fi
echo "ok: workbench still refuses COZE_PROJECT_ENV=PROD"

NODE_ENV=production HOSTNAME=127.0.0.1 PORT="${PORT}" \
  PUBLIC_EDITION_ACK=owner_authored_public_edition_v1 \
  SITE_EDITION=public NEXT_PUBLIC_SITE_EDITION=public \
  node dist/server-public.js >/dev/null 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 60); do
    if curl -sf -o /dev/null "${BASE}/" 2>/dev/null; then break; fi
    sleep 1
done
curl -sf -o /dev/null "${BASE}/" || fail "public server never became ready"

status_of() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${BASE}$1"; }

for path in / /novel /novel/read /graph /sukaiyuan /about /discover /archives /persons; do
    code=$(status_of "${path}")
    [[ "${code}" == "200" ]] || fail "${path} returned ${code}, expected 200"
done
echo "ok: reader routes serve"

# Owner surfaces must be gone, not merely unlinked.
for path in /studio /studio/comments /insights /api/local/analytics /api/local/messages /api/local/novel-comments; do
    code=$(status_of "${path}")
    [[ "${code}" == "404" ]] || fail "${path} returned ${code}, expected 404 on the public edition"
done
echo "ok: owner tooling and loopback endpoints are absent"

# The retired edition hall must stay retired.
code=$(status_of /novel/editions)
[[ "${code}" == "404" ]] || fail "/novel/editions returned ${code}, expected 404"

# Indexing stays closed until the owner opens it.
headers=$(curl -sI --max-time 10 "${BASE}/")
grep -qi 'x-robots-tag: *noindex' <<<"${headers}" || fail "noindex header is missing"
grep -qi 'content-security-policy' <<<"${headers}" || fail "CSP header is missing"
echo "ok: noindex and CSP present"

# A page a reader will actually open, with its images.
page=$(curl -s --max-time 15 "${BASE}/novel/chapter/chapter-01")
grep -q 'pages-responsive/page-' <<<"${page}" || fail "chapter page is missing novel page images"
echo "ok: novel chapter serves watermarked page images"

echo "PASS: public edition smoke passed on ${BASE}"
