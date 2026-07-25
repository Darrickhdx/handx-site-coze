#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
if [[ -z "${SMOKE_PORT:-}" ]]; then
    SMOKE_PORT="$(python3 -c 'import socket; sock = socket.socket(); sock.bind(("127.0.0.1", 0)); print(sock.getsockname()[1]); sock.close()')"
fi
# macOS/BSD mktemp requires the XXXXXX placeholder at the end of the template.
SMOKE_LOG="$(mktemp "${TMPDIR:-/tmp}/sukaiyuan-smoke.XXXXXX")"
SERVER_PID=""
RUNTIME_FIXTURE=""
RUNTIME_LOG=""
RUNTIME_DATA_DIR=""

cleanup() {
    if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
        kill "${SERVER_PID}" 2>/dev/null || true
        wait "${SERVER_PID}" 2>/dev/null || true
    fi
    if [[ -n "${RUNTIME_LOG}" && -f "${RUNTIME_LOG}" ]]; then
        rm -f "${RUNTIME_LOG}"
    fi
    if [[ -n "${RUNTIME_FIXTURE}" && -d "${RUNTIME_FIXTURE}" ]]; then
        rm -rf "${RUNTIME_FIXTURE}"
    fi
    if [[ -n "${RUNTIME_DATA_DIR}" && -d "${RUNTIME_DATA_DIR}" ]]; then
        rm -rf "${RUNTIME_DATA_DIR}"
    fi
}
trap cleanup EXIT

cd "${COZE_WORKSPACE_PATH}"

if [[ ! -f dist/server.js ]]; then
    echo "Missing dist/server.js; run pnpm build first." >&2
    exit 1
fi

RUNTIME_DATA_DIR="$(mktemp -d "${TMPDIR:-/tmp}/sukaiyuan-private-runtime.XXXXXX")"
LOCAL_DATA_DIR="${RUNTIME_DATA_DIR}" DEPLOY_RUN_PORT="${SMOKE_PORT}" bash ./scripts/start.sh >"${SMOKE_LOG}" 2>&1 &
SERVER_PID=$!

ready=false
for _ in $(seq 1 40); do
    if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
        cat "${SMOKE_LOG}" >&2
        exit 1
    fi
    if curl --silent --fail "http://127.0.0.1:${SMOKE_PORT}/robots.txt" >/dev/null; then
        ready=true
        break
    fi
    sleep 0.25
done
if [[ "${ready}" != "true" ]]; then
    cat "${SMOKE_LOG}" >&2
    echo "Local preview did not become ready." >&2
    exit 1
fi

python3 tools/smoke_test_local_preview.py \
    --base-url "http://127.0.0.1:${SMOKE_PORT}" \
    --admin-token-file "${RUNTIME_DATA_DIR}/admin-token"

if [[ "$(stat -f '%Lp' "${RUNTIME_DATA_DIR}")" != "700" ]]; then
    echo "FAIL: private runtime directory permission is not 0700." >&2
    exit 1
fi
for private_file in "${RUNTIME_DATA_DIR}"/*; do
    if [[ -f "${private_file}" && "$(stat -f '%Lp' "${private_file}")" != "600" ]]; then
        echo "FAIL: private runtime file permission is not 0600: ${private_file}" >&2
        exit 1
    fi
done

cleanup
SERVER_PID=""

if COZE_PROJECT_ENV=PROD DEPLOY_RUN_PORT="$((SMOKE_PORT + 1))" bash ./scripts/start.sh >/dev/null 2>&1; then
    echo "FAIL: COZE_PROJECT_ENV=PROD was not rejected." >&2
    exit 1
fi
if NODE_ENV=production HOSTNAME=0.0.0.0 PORT="$((SMOKE_PORT + 2))" node dist/server.js >/dev/null 2>&1; then
    echo "FAIL: HOSTNAME=0.0.0.0 was not rejected." >&2
    exit 1
fi

# Prove that a freshly verified runtime dataset cannot be paired with a stale
# compiled server, and that a single mixed endpoint is rejected before Next.js
# starts. Both cases run against an isolated temporary fixture.
RUNTIME_FIXTURE="$(mktemp -d "${TMPDIR:-/tmp}/sukaiyuan-runtime-fixture.XXXXXX")"
RUNTIME_LOG="$(mktemp "${TMPDIR:-/tmp}/sukaiyuan-runtime-gate.XXXXXX")"
mkdir -p "${RUNTIME_FIXTURE}/src/data" "${RUNTIME_FIXTURE}/public/data"
cp src/data/research.json "${RUNTIME_FIXTURE}/src/data/research.json"
cp public/data/persons.json public/data/events.json public/data/timeline.json public/data/sources.json "${RUNTIME_FIXTURE}/public/data/"

ORIGINAL_GENERATION="$(node -e "const d=require('./src/data/research.json'); process.stdout.write(d._meta.generation_id)")"
FAKE_GENERATION="gen-0000000000000000000000000000000000000000000000000000000000000000"
PREVIEW_OLD_GENERATION="${ORIGINAL_GENERATION}" PREVIEW_FAKE_GENERATION="${FAKE_GENERATION}" \
    perl -pi -e 's/\Q$ENV{PREVIEW_OLD_GENERATION}\E/$ENV{PREVIEW_FAKE_GENERATION}/g' \
    "${RUNTIME_FIXTURE}/src/data/research.json" "${RUNTIME_FIXTURE}/public/data/"*.json
if (cd "${RUNTIME_FIXTURE}" && NODE_ENV=production HOSTNAME=127.0.0.1 PORT="$((SMOKE_PORT + 3))" node "${COZE_WORKSPACE_PATH}/dist/server.js") >"${RUNTIME_LOG}" 2>&1; then
    echo "FAIL: stale compiled server accepted a different coherent runtime generation." >&2
    exit 1
fi
if ! grep -q "compiled preview data differs from the research commit marker" "${RUNTIME_LOG}"; then
    cat "${RUNTIME_LOG}" >&2
    echo "FAIL: stale-build rejection did not come from the compiled/runtime binding gate." >&2
    exit 1
fi

cp src/data/research.json "${RUNTIME_FIXTURE}/src/data/research.json"
cp public/data/persons.json public/data/events.json public/data/timeline.json public/data/sources.json "${RUNTIME_FIXTURE}/public/data/"
PREVIEW_OLD_GENERATION="${ORIGINAL_GENERATION}" PREVIEW_FAKE_GENERATION="${FAKE_GENERATION}" \
    perl -pi -e 's/\Q$ENV{PREVIEW_OLD_GENERATION}\E/$ENV{PREVIEW_FAKE_GENERATION}/g' \
    "${RUNTIME_FIXTURE}/public/data/persons.json"
if (cd "${RUNTIME_FIXTURE}" && NODE_ENV=production HOSTNAME=127.0.0.1 PORT="$((SMOKE_PORT + 4))" node "${COZE_WORKSPACE_PATH}/dist/server.js") >"${RUNTIME_LOG}" 2>&1; then
    echo "FAIL: runtime server accepted a mixed endpoint generation." >&2
    exit 1
fi
if ! grep -q "persons.json metadata differs from the research commit marker" "${RUNTIME_LOG}"; then
    cat "${RUNTIME_LOG}" >&2
    echo "FAIL: mixed-endpoint rejection did not come from the five-file runtime gate." >&2
    exit 1
fi

echo "PASS: HTTP smoke, deployment gates, compiled/runtime binding, and five-file coherence checks passed."
