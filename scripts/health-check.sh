#!/bin/bash
# SMSOK — Health Check Dashboard (JSON output)
# Usage: ./scripts/health-check.sh
# Exit: 0 = healthy, 1 = unhealthy
set -uo pipefail

APP_URL="${APP_URL:-http://localhost:3000}"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5434}"
PG_USER="${PG_USER:-smsok}"
PG_DB="${PG_DB:-smsok}"
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6380}"

HEALTHY=true
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# ── 1. Next.js App ──
APP_STATUS="down"
APP_LATENCY=0
APP_HTTP=0
APP_LATENCY_RAW=$(curl -sf -o /dev/null -w "%{time_total}" --max-time 10 "${APP_URL}/api/health/ready" 2>/dev/null || echo "0")
APP_HTTP=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "${APP_URL}/api/health/ready" 2>/dev/null || echo "000")
APP_LATENCY=$(printf '%.0f' "$(echo "$APP_LATENCY_RAW * 1000" | bc 2>/dev/null || echo 0)")
if [ "$APP_HTTP" -ge 200 ] 2>/dev/null && [ "$APP_HTTP" -lt 400 ] 2>/dev/null; then
  APP_STATUS="up"
else
  HEALTHY=false
fi

# ── 2. PostgreSQL ──
PG_STATUS="down"
if PGPASSWORD="${PGPASSWORD:-smsok_dev_2026}" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -c "SELECT 1" > /dev/null 2>&1; then
  PG_STATUS="up"
else
  HEALTHY=false
fi

# ── 3. Redis ──
REDIS_STATUS="down"
REDIS_RESPONSE=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping 2>/dev/null)
if [ "$REDIS_RESPONSE" = "PONG" ]; then
  REDIS_STATUS="up"
else
  HEALTHY=false
fi

# ── Output JSON ──
if [ "$HEALTHY" = true ]; then
  OVERALL="healthy"
else
  OVERALL="unhealthy"
fi

cat <<EOF
{
  "status": "$OVERALL",
  "timestamp": "$TIMESTAMP",
  "checks": {
    "app": {
      "status": "$APP_STATUS",
      "url": "$APP_URL",
      "http_code": $APP_HTTP,
      "latency_ms": $APP_LATENCY
    },
    "postgresql": {
      "status": "$PG_STATUS",
      "host": "$PG_HOST",
      "port": $PG_PORT
    },
    "redis": {
      "status": "$REDIS_STATUS",
      "host": "$REDIS_HOST",
      "port": $REDIS_PORT
    }
  }
}
EOF

if [ "$HEALTHY" = true ]; then
  exit 0
else
  exit 1
fi
