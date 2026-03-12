#!/bin/bash
# SMSOK — Error Rate Monitor + Alerting
# Scans Docker logs for errors in the last 5 minutes
# Crontab: */5 * * * * /opt/smsok-clone/infra/error-alert.sh >> /var/log/smsok-monitor.log 2>&1
set -uo pipefail

ERROR_THRESHOLD=10    # alert if more than 10 errors in 5 min
CONTAINER="smsok-clone-app-1"
SINCE="5m"

log() { printf '[%s] error-alert: %s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$1"; }

# ── 1. Count errors in recent Docker logs ──
ERROR_COUNT=$(docker logs "$CONTAINER" --since "$SINCE" 2>&1 | grep -ciE '"level":\s*"?(error|fatal)|unhandled|ECONNREFUSED|FATAL|panic' || echo 0)

log "Errors in last $SINCE: $ERROR_COUNT"

if [ "$ERROR_COUNT" -gt "$ERROR_THRESHOLD" ]; then
  log "ALERT: Error rate HIGH ($ERROR_COUNT errors in $SINCE, threshold: $ERROR_THRESHOLD)"

  # Get recent error samples
  SAMPLES=$(docker logs "$CONTAINER" --since "$SINCE" 2>&1 | grep -iE '"level":\s*"?(error|fatal)|unhandled' | tail -5)

  # ── 2. Check for unhandled exceptions ──
  UNHANDLED=$(docker logs "$CONTAINER" --since "$SINCE" 2>&1 | grep -c "unhandled" || echo 0)
  if [ "$UNHANDLED" -gt 0 ]; then
    log "CRITICAL: $UNHANDLED unhandled exception(s) detected!"
  fi

  # ── 3. Send webhook alert if configured ──
  if [ -n "${ALERT_WEBHOOK:-}" ]; then
    ALERT_MSG="Error rate alert: $ERROR_COUNT errors in $SINCE (threshold: $ERROR_THRESHOLD)"
    [ "$UNHANDLED" -gt 0 ] && ALERT_MSG="$ALERT_MSG | $UNHANDLED UNHANDLED EXCEPTIONS"
    curl -sf -X POST "$ALERT_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"🔴 SMSOK Error Alert:\\n${ALERT_MSG}\\n\\nSamples:\\n$(echo "$SAMPLES" | head -3 | sed 's/"/\\"/g')\"}" \
      > /dev/null 2>&1 || log "Webhook send failed"
  fi
fi

# ── 4. Check for OOM kills ──
OOM=$(docker inspect "$CONTAINER" --format='{{.State.OOMKilled}}' 2>/dev/null || echo "false")
if [ "$OOM" = "true" ]; then
  log "CRITICAL: Container was OOM-killed! Restarting..."
  docker restart "$CONTAINER" 2>/dev/null
fi

# ── 5. Check restart count ──
RESTARTS=$(docker inspect "$CONTAINER" --format='{{.RestartCount}}' 2>/dev/null || echo "0")
if [ "$RESTARTS" -gt 5 ]; then
  log "WARNING: Container restarted $RESTARTS times"
fi
