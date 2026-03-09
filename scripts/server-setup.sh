#!/bin/bash
set -euo pipefail

# ============================================
# First-time Production Server Setup — SMSOK Clone
# Auto-deploy via Watchtower (no SSH needed after setup)
#
# Usage:
#   1. Copy this script + docker-compose.prod.yml to server
#   2. Run: bash server-setup.sh
#   3. After setup, push to main → auto-deploy via GHCR + Watchtower
# ============================================

APP_DIR="/opt/smsok-clone"
IMAGE="ghcr.io/lambogreny/smsok-clone:latest"
GHCR_USER="${GHCR_USER:-lambogreny}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}==>${NC} $1"; }
fail() { echo -e "${RED}==>${NC} $1"; exit 1; }

echo "================================================"
echo "  SMSOK Clone — Production Server Setup"
echo "  Auto-deploy: GHCR → Watchtower (no SSH needed)"
echo "================================================"
echo ""

# --- 1. Prerequisites ---
log "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || fail "Docker not installed. Run: curl -fsSL https://get.docker.com | sh"
command -v docker compose version >/dev/null 2>&1 || fail "Docker Compose V2 not found"
log "Docker: $(docker --version | head -1)"

# --- 2. Create app directory ---
log "Creating app directory: $APP_DIR"
sudo mkdir -p "$APP_DIR"/{backups,scripts,config}
sudo chown -R "$(whoami)" "$APP_DIR"
cd "$APP_DIR"

# --- 3. Copy files ---
if [ ! -f docker-compose.prod.yml ]; then
  fail "docker-compose.prod.yml not found in $APP_DIR
   Copy these files first:
   - docker-compose.prod.yml
   - .env.production.template → .env
   - scripts/backup.sh
   - scripts/uptime.sh"
fi

# --- 4. GHCR Login (required for Watchtower to pull private images) ---
log "Logging into GHCR (GitHub Container Registry)..."
if [ -z "${GHCR_TOKEN:-}" ]; then
  echo ""
  echo "   GHCR_TOKEN not set. Create a GitHub PAT with 'read:packages' scope:"
  echo "   https://github.com/settings/tokens/new?scopes=read:packages"
  echo ""
  read -rp "   Enter GHCR token (PAT): " GHCR_TOKEN
fi
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
log "GHCR login: OK"

# Save GHCR credentials for Watchtower (it reads Docker's config.json)
log "Watchtower will use Docker's stored GHCR credentials"

# --- 5. Setup .env ---
if [ ! -f .env ]; then
  if [ -f .env.production.template ]; then
    cp .env.production.template .env

    # Generate secrets automatically
    JWT_SECRET=$(openssl rand -hex 32)
    DB_PASSWORD=$(openssl rand -hex 16)
    WATCHTOWER_TOKEN=$(openssl rand -hex 16)

    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env

    # Add Watchtower config
    echo "" >> .env
    echo "# Watchtower (auto-deploy)" >> .env
    echo "WATCHTOWER_TOKEN=$WATCHTOWER_TOKEN" >> .env
    echo "WATCHTOWER_NOTIFY_URL=" >> .env

    # Update DATABASE_URL with generated password
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://smsok:${DB_PASSWORD}@postgres:5432/smsok|" .env

    warn "Created .env with auto-generated secrets"
    echo ""
    echo "   ⚠️  EDIT .env NOW for remaining settings:"
    echo "   nano $APP_DIR/.env"
    echo ""
    echo "   Still need:"
    echo "   - SMS_API_USERNAME / SMS_API_PASSWORD"
    echo "   - EASYSLIP_API_KEY"
    echo "   - NEXT_PUBLIC_APP_URL (your domain)"
    echo ""
    echo "   Auto-generated (safe to keep):"
    echo "   - JWT_SECRET: $JWT_SECRET"
    echo "   - DB_PASSWORD: $DB_PASSWORD"
    echo "   - WATCHTOWER_TOKEN: $WATCHTOWER_TOKEN"
    echo ""
    echo "   Save this Watchtower token for GitHub Actions secret:"
    echo "   WATCHTOWER_TOKEN=$WATCHTOWER_TOKEN"
    echo ""
    read -rp "   Press Enter after editing .env..." _
  else
    fail ".env.production.template not found"
  fi
fi

# --- 6. Pull images ---
log "Pulling Docker images..."
docker pull "$IMAGE"
docker compose -f docker-compose.prod.yml pull

# --- 7. Start all services (including Watchtower) ---
log "Starting services..."
docker compose -f docker-compose.prod.yml up -d

# --- 8. Wait for health ---
log "Waiting for app to be ready..."
for i in 1 2 3 4 5 6 7 8; do
  sleep 5
  if curl -sf http://localhost:3458/api/health/ready > /dev/null 2>&1; then
    log "App is healthy!"
    break
  fi
  echo "   Attempt $i/8..."
  if [ "$i" = "8" ]; then
    warn "App not ready after 40s — check logs: docker compose -f docker-compose.prod.yml logs app"
  fi
done

# --- 9. Verify Watchtower ---
log "Verifying Watchtower..."
if docker compose -f docker-compose.prod.yml ps watchtower | grep -q "running"; then
  log "Watchtower is running — auto-deploy active!"
else
  warn "Watchtower not running — check: docker compose -f docker-compose.prod.yml logs watchtower"
fi

# --- 10. Setup cron for backups and monitoring ---
log "Setting up cron jobs..."
CRON_BACKUP="0 3 * * * cd $APP_DIR && ./scripts/backup.sh daily >> /var/log/smsok-backup.log 2>&1"
CRON_UPTIME="*/5 * * * * $APP_DIR/scripts/uptime.sh >> /var/log/smsok-uptime.log 2>&1"
(crontab -l 2>/dev/null | grep -v smsok; echo "$CRON_BACKUP"; echo "$CRON_UPTIME") | crontab -

# --- Done ---
echo ""
echo "================================================"
log "Setup complete!"
echo ""
echo "   App:        http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):3458"
echo "   Health:     http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):3458/api/health"
echo "   Backups:    $APP_DIR/backups/ (daily at 3am)"
echo ""
echo "   📦 Auto-Deploy Flow:"
echo "   push to main → GitHub Actions builds → GHCR push → Watchtower pulls → app restarts"
echo "   No SSH needed! Watchtower checks every 60 seconds."
echo ""
echo "   🔑 GitHub Actions Secrets needed:"
echo "   WATCHTOWER_URL = http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'SERVER_IP'):8080"
echo "   WATCHTOWER_TOKEN = (from .env)"
echo "   SERVER_HOST = $(hostname -I 2>/dev/null | awk '{print $1}' || echo 'SERVER_IP')"
echo ""
echo "   📋 Useful commands:"
echo "   docker compose -f docker-compose.prod.yml logs -f app       # App logs"
echo "   docker compose -f docker-compose.prod.yml logs -f watchtower # Deploy logs"
echo "   docker compose -f docker-compose.prod.yml ps                 # Status"
echo "================================================"
