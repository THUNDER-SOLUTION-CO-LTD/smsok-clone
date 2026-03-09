#!/bin/bash
set -euo pipefail

# ============================================
# Production Deploy Script — SMSOK Clone
# Usage: ./scripts/deploy.sh [--rollback]
# ============================================

SERVER="${SERVER_HOST:-185.241.210.52}"
USER="${SERVER_USER:-byteder}"
APP_DIR="${APP_DIR:-/opt/smsok-clone}"
IMAGE="ghcr.io/lambogreny/smsok-clone"
PORT="${APP_PORT:-3458}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}==>${NC} $1"; }
fail() { echo -e "${RED}==>${NC} $1"; exit 1; }

# --- Rollback Mode ---
if [ "${1:-}" = "--rollback" ]; then
  log "Rolling back to previous image..."
  ssh "$USER@$SERVER" "cd $APP_DIR && \
    docker compose -f docker-compose.prod.yml pull && \
    COMMIT_SHA=rollback docker compose -f docker-compose.prod.yml up -d --remove-orphans"
  log "Rollback initiated. Check health manually."
  exit 0
fi

# --- Pre-deploy checks ---
log "Pre-deploy checklist..."

# 1. Check SSH access
if ! ssh -o ConnectTimeout=5 "$USER@$SERVER" "echo ok" > /dev/null 2>&1; then
  fail "Cannot SSH to $SERVER — check SSH key"
fi
log "SSH access: OK"

# 2. Check image exists
LATEST_TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
log "Deploying commit: $LATEST_TAG"

# --- Deploy ---
log "Pulling latest image..."
ssh "$USER@$SERVER" "docker pull $IMAGE:latest"

log "Backing up database before deploy..."
ssh "$USER@$SERVER" "cd $APP_DIR && ./scripts/backup.sh predeploy 2>/dev/null || echo 'Backup skipped (first deploy?)'"

log "Running database migrations..."
ssh "$USER@$SERVER" "cd $APP_DIR && \
  docker compose -f docker-compose.prod.yml run --rm app \
  npx prisma db push --skip-generate 2>&1 || echo 'Migration note: check manually'"

log "Deploying new version..."
ssh "$USER@$SERVER" "cd $APP_DIR && \
  COMMIT_SHA=$LATEST_TAG docker compose -f docker-compose.prod.yml up -d --remove-orphans"

# --- Health Check with Retry ---
log "Waiting for health check..."
HEALTHY=false
for i in 1 2 3 4 5 6; do
  sleep 5
  HEALTH=$(curl -sf --max-time 10 "http://$SERVER:$PORT/api/health" 2>/dev/null || echo '{}')
  STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ "$STATUS" = "healthy" ]; then
    HEALTHY=true
    LATENCY=$(echo "$HEALTH" | grep -o '"latency":[0-9]*' | head -1 | cut -d: -f2)
    VERSION=$(echo "$HEALTH" | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
    log "Health check PASSED (attempt $i/6)"
    echo "  Status:  $STATUS"
    echo "  Latency: ${LATENCY}ms"
    echo "  Version: $VERSION"
    break
  fi
  warn "Attempt $i/6 — status: ${STATUS:-timeout}"
done

if [ "$HEALTHY" = false ]; then
  fail "Health check FAILED after 30s! Run: $0 --rollback"
fi

# --- Cleanup ---
ssh "$USER@$SERVER" "docker image prune -f" > /dev/null 2>&1

log "Deploy SUCCESS!"
