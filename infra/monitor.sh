#!/bin/bash
# SMSOK — Production Monitoring Script
# Checks: app health, DB, Redis, disk, memory, containers
# Crontab: */5 * * * * /opt/smsok-clone/infra/monitor.sh >> /var/log/smsok-monitor.log 2>&1
set -uo pipefail

APP_URL="${APP_URL:-http://localhost:3458}"
DOMAIN="${DOMAIN:-smsok.9phum.me}"
DISK_THRESHOLD=85    # alert if disk usage > 85%
MEMORY_THRESHOLD=90  # alert if memory usage > 90%
LOG_FILE="/var/log/smsok-monitor.log"

ALERTS=()
log() { printf '[%s] %s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$1"; }
alert() { ALERTS+=("$1"); log "ALERT: $1"; }

# ── 1. App Health ──
log "Checking app health..."
HEALTH_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 10 "${APP_URL}/api/health" 2>/dev/null)
if [ "$HEALTH_STATUS" -ge 200 ] && [ "$HEALTH_STATUS" -lt 400 ]; then
  log "App health: OK (HTTP $HEALTH_STATUS)"
else
  alert "App health FAILED (HTTP $HEALTH_STATUS)"
fi

# ── 2. Container Status ──
log "Checking containers..."
for container in smsok-clone-app-1 smsok-clone-workers-1 smsok-clone-postgres-1 smsok-clone-redis-1; do
  STATUS=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "missing")
  HEALTH=$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")

  if [ "$STATUS" != "running" ]; then
    alert "$container is $STATUS"
  elif [ "$HEALTH" = "unhealthy" ]; then
    alert "$container is unhealthy"
  fi
done

# ── 3. Disk Usage ──
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
log "Disk usage: ${DISK_USAGE}%"
if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
  alert "Disk usage HIGH: ${DISK_USAGE}% (threshold: ${DISK_THRESHOLD}%)"

  # Show top space consumers
  log "Top disk consumers:"
  du -sh /var/lib/docker/* 2>/dev/null | sort -rh | head -5
  du -sh /opt/smsok-backups/* 2>/dev/null | sort -rh | head -3
fi

# ── 4. Memory Usage ──
MEM_TOTAL=$(free | awk '/Mem:/ {print $2}')
MEM_USED=$(free | awk '/Mem:/ {print $3}')
MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))
log "Memory usage: ${MEM_PERCENT}% (${MEM_USED}/${MEM_TOTAL} kB)"
if [ "$MEM_PERCENT" -gt "$MEMORY_THRESHOLD" ]; then
  alert "Memory usage HIGH: ${MEM_PERCENT}% (threshold: ${MEMORY_THRESHOLD}%)"

  # Show per-container memory
  log "Container memory:"
  docker stats --no-stream --format "  {{.Name}}: {{.MemUsage}} ({{.MemPerc}})" 2>/dev/null
fi

# ── 5. Docker disk usage ──
DOCKER_DISK=$(docker system df --format '{{.Size}}' 2>/dev/null | head -1)
log "Docker disk: $DOCKER_DISK"

# ── 6. DB connection check ──
DB_CHECK=$(docker exec smsok-clone-postgres-1 pg_isready -U smsok 2>/dev/null)
if echo "$DB_CHECK" | grep -q "accepting"; then
  log "PostgreSQL: accepting connections"
else
  alert "PostgreSQL NOT accepting connections"
fi

# ── 7. Redis check ──
REDIS_CHECK=$(docker exec smsok-clone-redis-1 redis-cli ping 2>/dev/null)
if [ "$REDIS_CHECK" = "PONG" ]; then
  REDIS_MEM=$(docker exec smsok-clone-redis-1 redis-cli info memory 2>/dev/null | grep used_memory_human | tr -d '\r')
  log "Redis: PONG ($REDIS_MEM)"
else
  alert "Redis NOT responding"
fi

# ── 8. SSL cert expiry check ──
if command -v openssl &>/dev/null && [ -n "$DOMAIN" ]; then
  CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -n "$CERT_EXPIRY" ]; then
    CERT_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$CERT_EXPIRY" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (CERT_EPOCH - NOW_EPOCH) / 86400 ))
    log "SSL cert expires in ${DAYS_LEFT} days ($CERT_EXPIRY)"
    if [ "$DAYS_LEFT" -lt 14 ]; then
      alert "SSL cert expires in ${DAYS_LEFT} days!"
    fi
  fi
fi

# ── 9. Summary ──
echo ""
if [ ${#ALERTS[@]} -eq 0 ]; then
  log "All checks passed"
else
  log "${#ALERTS[@]} ALERT(s):"
  for a in "${ALERTS[@]}"; do
    log "  - $a"
  done

  # Send webhook alert if configured
  if [ -n "${ALERT_WEBHOOK:-}" ]; then
    ALERT_TEXT=$(printf '%s\n' "${ALERTS[@]}")
    curl -sf -X POST "$ALERT_WEBHOOK" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"🔴 SMSOK Monitor Alert ($(hostname)):\n${ALERT_TEXT}\"}" \
      > /dev/null 2>&1 || true
  fi

  exit 1
fi
