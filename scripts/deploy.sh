#!/bin/bash
set -euo pipefail

# ============================================
# Zero-Downtime Production Deploy — SMSOK Clone
# Usage: ./scripts/deploy.sh [--rollback] [--quick]
# ============================================

SERVER="${SERVER_HOST:-185.241.210.52}"
USER="${SERVER_USER:-byteder}"
APP_DIR="${APP_DIR:-/opt/smsok-clone}"
IMAGE="ghcr.io/lambogreny/smsok-clone"
PORT="${APP_PORT:-3458}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}==>${NC} $1"; }
fail() { echo -e "${RED}==>${NC} $1"; exit 1; }

remote() { ssh -o ConnectTimeout=5 "$USER@$SERVER" "$@"; }

health_check() {
  local URL="$1"
  local ATTEMPTS="${2:-6}"
  for i in $(seq 1 "$ATTEMPTS"); do
    sleep 5
    HEALTH=$(curl -sf --max-time 10 "$URL/api/health" 2>/dev/null || echo '{}')
    STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$STATUS" = "healthy" ]; then
      LATENCY=$(echo "$HEALTH" | grep -o '"latency":[0-9]*' | head -1 | cut -d: -f2)
      VERSION=$(echo "$HEALTH" | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
      log "Health OK (attempt $i/$ATTEMPTS) — ${LATENCY}ms, version: ${VERSION}"
      return 0
    fi
    warn "Attempt $i/$ATTEMPTS — ${STATUS:-timeout}"
  done
  return 1
}

# --- Rollback ---
if [ "${1:-}" = "--rollback" ]; then
  log "Rolling back to previous image..."
  PREV_IMAGE=$(remote "docker inspect --format='{{.Config.Image}}' smsok-clone-app-old 2>/dev/null" || echo "")
  if [ -n "$PREV_IMAGE" ]; then
    remote "cd $APP_DIR && docker stop smsok-clone-app-1 2>/dev/null; \
      docker rename smsok-clone-app-1 smsok-clone-app-failed 2>/dev/null; \
      docker rename smsok-clone-app-old smsok-clone-app-1 2>/dev/null; \
      docker start smsok-clone-app-1 2>/dev/null"
    log "Rolled back to previous container"
  else
    warn "No previous container found — restarting current"
    remote "cd $APP_DIR && docker compose -f docker-compose.prod.yml restart app"
  fi
  health_check "http://$SERVER:$PORT" 4 || warn "Health check failed after rollback"
  exit 0
fi

# --- Pre-checks ---
log "Pre-deploy checks..."
remote "echo ok" || fail "Cannot SSH to $SERVER"
log "SSH: OK"

LATEST_TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
FULL_SHA=$(git rev-parse HEAD 2>/dev/null || echo "latest")
log "Deploying: $LATEST_TAG"

# --- Pull new image ---
log "Pulling image..."
remote "docker pull $IMAGE:latest"

# --- Backup ---
log "Pre-deploy backup..."
remote "cd $APP_DIR && ./scripts/backup.sh predeploy 2>/dev/null" || warn "Backup skipped"

# --- DB Migration (before swap) ---
log "Running DB migrations..."
remote "cd $APP_DIR && \
  docker compose -f docker-compose.prod.yml run --rm -e DATABASE_URL=\$DATABASE_URL app \
  npx prisma db push --skip-generate 2>&1" || warn "Migration needs review"

# --- Zero-Downtime Deploy ---
log "Starting new container..."

# Save current container as backup
remote "docker rename smsok-clone-app-1 smsok-clone-app-old 2>/dev/null" || true

# Start new container
remote "cd $APP_DIR && \
  COMMIT_SHA=$FULL_SHA docker compose -f docker-compose.prod.yml up -d --no-deps --remove-orphans app"

# --- Verify new container ---
if health_check "http://$SERVER:$PORT" 6; then
  log "New container healthy — removing old container"
  remote "docker rm -f smsok-clone-app-old 2>/dev/null" || true
  remote "docker image prune -f" > /dev/null 2>&1
  log "Deploy SUCCESS! ($LATEST_TAG)"
else
  # Rollback: restore old container
  warn "New container UNHEALTHY — rolling back!"
  remote "docker stop smsok-clone-app-1 2>/dev/null; \
    docker rm smsok-clone-app-1 2>/dev/null; \
    docker rename smsok-clone-app-old smsok-clone-app-1 2>/dev/null; \
    docker start smsok-clone-app-1 2>/dev/null"
  health_check "http://$SERVER:$PORT" 3 || true
  fail "Deploy FAILED — rolled back to previous version"
fi
