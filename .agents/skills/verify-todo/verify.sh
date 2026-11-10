#!/usr/bin/env bash
# Verification helper for Todo. Run on the dev box from anywhere inside the checkout.
#   verify.sh launch            push Convex functions, make sure the test account exists, start or reuse the dev server
#   verify.sh doctor            read-only: is this instance worth driving?
#   verify.sh proof <test> [label]   run one e2e test with a full trace into .e2e/proof/<stamp>-<label>/
#   verify.sh cleanup           stop the dev server this helper started. Keeps .e2e/proof/.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
PORT=${TODO_PORT:-3001}
URL="http://localhost:$PORT"
STATE=.e2e/verify
PID_FILE=$STATE/dev.pid
LOG=.e2e/logs/verify-dev.log
PROD_DEPLOYMENT=giddy-eagle-641
mkdir -p "$STATE" .e2e/logs .e2e/proof

die() { echo "verify: $*" >&2; exit 1; }
has_env() { grep -q "^$1=." .env.local 2>/dev/null; }
env_value() { grep "^$1=" .env.local | head -1 | cut -d= -f2-; }
serving() { curl -fs -o /dev/null --max-time 5 "$URL/api/auth/ok"; }
ours() { [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; }

launch() {
  [ -f .env.local ] || die ".env.local is missing. Copy it from another checkout of this repo; README 'Local development' lists the keys."
  case "$(env_value CONVEX_DEPLOYMENT)" in *"$PROD_DEPLOYMENT"*) die "CONVEX_DEPLOYMENT points at production. Verification runs on the dev deployment only." ;; esac
  [ -d node_modules ] || bun install
  echo "verify: pushing Convex functions to the dev deployment"
  bunx convex dev --once --typecheck disable >/dev/null 2>&1 || die "convex dev --once failed. Run it by hand to see why."
  if has_env TEST_USER_EMAIL && has_env TEST_USER_PASSWORD; then
    # Creates the test account once. "already exists" on later runs is expected. Bun loads .env.local itself.
    args=$(bun -e 'console.log(JSON.stringify({ email: process.env.TEST_USER_EMAIL, password: process.env.TEST_USER_PASSWORD, name: "Test User" }))')
    if bunx convex run admin:createUser "$args" >/dev/null 2>&1; then echo "verify: created the test account"; else echo "verify: test account already exists"; fi
  else
    die "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local"
  fi
  if serving; then
    if ours; then echo "verify: reusing the dev server this helper started (pid $(cat "$PID_FILE"))"; else echo "verify: $URL is already served by a process this helper did not start; reusing it, cleanup will leave it running"; fi
  else
    echo "verify: starting next dev on port $PORT (log $LOG)"
    setsid bash -c "echo \$\$ > '$PID_FILE'; exec bun x next dev --port $PORT" >"$LOG" 2>&1 < /dev/null &
    for _ in $(seq 1 60); do serving && break; sleep 2; done
    serving || die "dev server never answered $URL/api/auth/ok. See $LOG"
  fi
  # Ready means usable: the sign-in page compiles and renders, not only the auth route.
  curl -fsS -o /dev/null --max-time 120 "$URL/sign-in" || die "$URL/sign-in did not render. See $LOG"
  echo "verify: ready at $URL"
}

doctor() {
  local fail=0
  check() { if eval "$2"; then echo "ok    $1"; else echo "FAIL  $1"; fail=1; fi; }
  echo "checkout  $ROOT @ $(git rev-parse --short HEAD)$(git diff --quiet && git diff --cached --quiet || echo ' (uncommitted changes)')"
  echo "deployment $(env_value CONVEX_DEPLOYMENT 2>/dev/null | sed 's/ *#.*//')"
  check "dev deployment, not production" "! env_value CONVEX_DEPLOYMENT | grep -q '$PROD_DEPLOYMENT'"
  check "$URL/api/auth/ok answers" "serving"
  if ours; then echo "ok    dev server started by this helper (pid $(cat "$PID_FILE"))"; else echo "note  dev server on port $PORT was not started by this helper: drive it only if you or the user started it for this work"; fi
  check ".env.local has TEST_USER_EMAIL and TEST_USER_PASSWORD" "has_env TEST_USER_EMAIL && has_env TEST_USER_PASSWORD"
  check ".env.local has ANTHROPIC_API_KEY (agent steps)" "has_env ANTHROPIC_API_KEY"
  check "Convex DEV_TOOLS is true (dev data dock)" "[ \"\$(bunx convex env get DEV_TOOLS 2>/dev/null)\" = true ]"
  check "Convex ALLOWED_EMAILS covers the test account" "bunx convex env get ALLOWED_EMAILS 2>/dev/null | tr ',' '\n' | grep -qixF \"\$(env_value TEST_USER_EMAIL)\""
  check "e2e installed" "[ -x node_modules/.bin/e2e ]"
  return $fail
}

proof() {
  local test=${1:?usage: verify.sh proof <tests/file.e2e.ts[:line]> [label]}
  local label=${2:-$(basename "${test%%:*}" .e2e.ts)}
  local out=".e2e/proof/$(date +%Y%m%d-%H%M%S)-$label"
  echo "verify: running $test, evidence in $out"
  set +e
  bunx e2e run "$test" --retries 0 --trace on --output "$out"
  local code=$?
  set -e
  echo "verify: exit $code. Trace pages: $out/results/*/trace.md"
  return $code
}

cleanup() {
  if ours; then
    local pid; pid=$(cat "$PID_FILE")
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    echo "verify: stopped the dev server this helper started (pid $pid)"
  else
    echo "verify: no dev server started by this helper is running; nothing to stop"
  fi
  rm -f "$PID_FILE"
  echo "verify: evidence kept in .e2e/proof/"
}

case "${1:-}" in
  launch) launch ;;
  doctor) doctor ;;
  proof) shift; proof "$@" ;;
  cleanup) cleanup ;;
  *) sed -n '2,6p' "$0"; exit 2 ;;
esac
