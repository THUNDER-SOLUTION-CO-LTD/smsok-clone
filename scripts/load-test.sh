#!/bin/bash
set -uo pipefail

# ============================================
# Load Test — SMSOK Clone
# Usage: ./scripts/load-test.sh [url] [concurrent] [total]
# ============================================

URL="${1:-http://localhost:3000}"
CONCURRENT="${2:-10}"
TOTAL="${3:-100}"

echo "================================================"
echo "  SMSOK Clone — Load Test"
echo "  URL:        $URL"
echo "  Concurrent: $CONCURRENT"
echo "  Total:      $TOTAL requests"
echo "================================================"
echo ""

# Check if server is up
if ! curl -sf --max-time 5 "$URL/api/health/live" > /dev/null 2>&1; then
  echo "ERROR: Server not responding at $URL"
  exit 1
fi

run_test() {
  local ENDPOINT="$1"
  local LABEL="$2"
  local TOTAL_OK=0
  local TOTAL_FAIL=0
  local TOTAL_TIME=0
  local MIN_TIME=99999
  local MAX_TIME=0
  local TIMES=""

  echo "--- $LABEL: $ENDPOINT ---"

  for batch in $(seq 1 $((TOTAL / CONCURRENT))); do
    PIDS=""
    for j in $(seq 1 "$CONCURRENT"); do
      (
        RESULT=$(curl -s -o /dev/null -w "%{http_code} %{time_total}" --max-time 10 "${URL}${ENDPOINT}" 2>/dev/null)
        echo "$RESULT"
      ) &
      PIDS="$PIDS $!"
    done

    for PID in $PIDS; do
      RESULT=$(wait "$PID" 2>/dev/null; echo "")
    done
  done

  # Simple sequential test for accurate timing
  local OK=0 FAIL=0 SUM=0
  for i in $(seq 1 "$TOTAL"); do
    RESULT=$(curl -s -o /dev/null -w "%{http_code} %{time_total}" --max-time 10 "${URL}${ENDPOINT}" 2>/dev/null)
    CODE=$(echo "$RESULT" | awk '{print $1}')
    TIME=$(echo "$RESULT" | awk '{print $2}')

    if [ "$CODE" -ge 200 ] && [ "$CODE" -lt 400 ] 2>/dev/null; then
      OK=$((OK + 1))
    else
      FAIL=$((FAIL + 1))
    fi

    TIME_MS=$(echo "$TIME * 1000" | bc 2>/dev/null || echo "0")
    SUM=$(echo "$SUM + $TIME_MS" | bc 2>/dev/null || echo "0")

    # Progress
    if [ $((i % 25)) -eq 0 ]; then
      echo "  Progress: $i/$TOTAL"
    fi
  done

  AVG=$(echo "scale=0; $SUM / $TOTAL" | bc 2>/dev/null || echo "N/A")
  echo "  Results: ${OK} OK, ${FAIL} failed (${TOTAL} total)"
  echo "  Avg response: ${AVG}ms"
  echo ""
}

# --- Tests ---
echo "1/4 Landing page (static)"
run_test "/" "GET /"

echo "2/4 Health endpoint (DB check)"
run_test "/api/health" "GET /api/health"

echo "3/4 Packages API (DB read)"
run_test "/api/v1/packages" "GET /api/v1/packages"

echo "4/4 Live probe (no DB)"
run_test "/api/health/live" "GET /api/health/live"

# --- Memory after load ---
echo "--- Post-test Health ---"
HEALTH=$(curl -sf --max-time 5 "$URL/api/health" 2>/dev/null || echo '{}')
echo "$HEALTH" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    m = d.get('memory', {})
    print(f'  Memory: RSS={m.get(\"rss\",\"?\")}MB, Heap={m.get(\"heap\",\"?\")}MB/{m.get(\"heapTotal\",\"?\")}MB')
    print(f'  Uptime: {d.get(\"uptime\",\"?\")}s')
    print(f'  DB latency: {d.get(\"checks\",{}).get(\"database\",{}).get(\"latency\",\"?\")}ms')
except: print('  Could not parse health response')
" 2>/dev/null

echo ""
echo "================================================"
echo "  Load test complete!"
echo "================================================"
