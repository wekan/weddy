#!/usr/bin/env bash
# Run WeKan's browser and API tests against a Weddy binary - locally only.
#
#   bash tests/wekan/run.sh [weddy-binary] [playwright args...]
#
# Starts the binary with a fresh data directory, the database also on TCP for
# the tests' own seeding (WeKan's helpers/db.js), and runs Playwright with
# playwright.weddy.config.js. Node.js runs the tests only; Weddy has none.
#
# Tools: TOOLS (default: WeKan's .tools when Weddy is checked out in .tools/w/)
# gives node-*/bin, bin/go and ms-playwright; WEKAN_DIR (default: that WeKan)
# gives the translations a few WeKan specs read. LOG_DIR gets the logs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$ROOT/tests/wekan"
TOOLS="${TOOLS:-$(cd "$ROOT/../.." 2>/dev/null && pwd)}"
[ -d "$TOOLS/bin" ] || [ -d "$TOOLS/ms-playwright" ] || TOOLS=""
WEKAN_DIR="${WEKAN_DIR:-${TOOLS:+$(cd "$TOOLS/.." && pwd)}}"
for n in "$TOOLS"/node-v*/bin; do [ -x "$n/node" ] && PATH="$n:$PATH"; done
export PATH
command -v node >/dev/null || { echo "run.sh: Node.js is needed to run the tests (TOOLS/node-*/bin or PATH)" >&2; exit 1; }
export TMPDIR="${TMPDIR:-${TOOLS:+$TOOLS/tmp}}"; mkdir -p "${TMPDIR:-/tmp}"

BIN="${1:-}"; [ $# -eq 0 ] || shift
if [ -z "$BIN" ]; then
  BIN="$(ls -t "$ROOT"/out-local/weddy-*-"$(uname -s | tr A-Z a-z)"-* 2>/dev/null | grep -v '\.\(xz\|sha256\|log\)$' | head -n 1 || true)"
fi
[ -x "$BIN" ] || { echo "run.sh: no Weddy binary - build one with ./build.sh local" >&2; exit 1; }
LOG_DIR="${LOG_DIR:-$ROOT/log/$(date +%Y-%m-%d_%H-%M-%S)}"; mkdir -p "$LOG_DIR"

# Translations a few WeKan specs read, from WeKan itself (94 MB, not copied).
if [ -n "$WEKAN_DIR" ] && [ -d "$WEKAN_DIR/imports/i18n/data" ] && [ ! -e "$HERE/imports/i18n/data" ]; then
  ln -s "$WEKAN_DIR/imports/i18n/data" "$HERE/imports/i18n/data"
fi
if [ ! -d "$HERE/node_modules/@playwright/test" ]; then
  ( cd "$HERE" && npm ci --no-audit --no-fund --ignore-scripts )
fi

# The browser, once, beside the other tools: chromium unless the run asks for others.
if [ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ] || [ -n "$TOOLS" ]; then
  export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$TOOLS/ms-playwright}"
fi
( cd "$HERE" && npx playwright install ${WEKAN_PLAYWRIGHT_ALL:+firefox webkit} chromium >/dev/null )

free_port() { node -e 'const s=require("net").createServer().listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})'; }
PORT="$(free_port)"; DBPORT="$(free_port)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/weddy-wekan.XXXXXX")"
cat > "$WORK/Caddyfile" <<CADDY
{
	admin off
	persist_config off
	wekan {
		data $WORK/data
		database_listen 127.0.0.1:$DBPORT
	}
}
http://127.0.0.1:$PORT {
	wekan
}
CADDY
"$BIN" run --config "$WORK/Caddyfile" --adapter caddyfile > "$LOG_DIR/weddy-server.log" 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; wait "$PID" 2>/dev/null || true; rm -rf "$WORK"; }
trap cleanup EXIT
for _ in $(seq 1 100); do
  curl -fsS -o /dev/null "http://127.0.0.1:$PORT/sign-in" 2>/dev/null && break
  kill -0 "$PID" 2>/dev/null || { echo "run.sh: Weddy exited:" >&2; tail -n 20 "$LOG_DIR/weddy-server.log" >&2; exit 1; }
  sleep 0.2
done

export WEKAN_BASE_URL="http://127.0.0.1:$PORT" WEKAN_MONGO_URL="mongodb://127.0.0.1:$DBPORT/wekan"
export WEDDY_TEST_RESULTS="$LOG_DIR/test-results" WEDDY_TEST_REPORT="$LOG_DIR/playwright-report"
cd "$HERE"
set +e
npx playwright test -c playwright.weddy.config.js "$@" 2>&1 | tee "$LOG_DIR/weddy-wekan-playwright.log"
status=${PIPESTATUS[0]}
echo "===== WeKan tests against Weddy finished: exit $status (logs in $LOG_DIR) ====="
exit "$status"
