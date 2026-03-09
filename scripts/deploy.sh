#!/bin/bash
set -euo pipefail
SERVER="${SERVER_HOST:-185.241.210.52}"
USER="${SERVER_USER:-byteder}"
APP_DIR="${APP_DIR:-/opt/smsok-clone}"
IMAGE="ghcr.io/lambogreny/smsok-clone:latest"

echo "==> Deploying smsok-clone to $SERVER"

# Pull latest image
ssh "$USER@$SERVER" "docker pull $IMAGE"

# Deploy with docker compose
ssh "$USER@$SERVER" "cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d --remove-orphans"

# Wait for health check
echo "==> Waiting for health check..."
sleep 10

# Verify health endpoint
HEALTH=$(curl -sf --connect-timeout 10 "http://$SERVER:3458/api/health" 2>/dev/null || echo '{"status":"unreachable"}')
STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | head -1)

if echo "$STATUS" | grep -q "healthy"; then
  echo "==> Deploy SUCCESS — $STATUS"
  echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
else
  echo "==> WARNING — $STATUS"
  echo "$HEALTH"
  exit 1
fi

# Cleanup
ssh "$USER@$SERVER" "docker image prune -f"
echo "==> Done!"
