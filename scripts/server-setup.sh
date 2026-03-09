#!/bin/bash
set -euo pipefail

# ============================================
# First-time Production Server Setup
# Run on server: curl -sSL <url> | bash
# Or: scp scripts/server-setup.sh user@server: && ssh user@server ./server-setup.sh
# ============================================

APP_DIR="/opt/smsok-clone"
IMAGE="ghcr.io/lambogreny/smsok-clone:latest"

echo "==> Setting up SMSOK Clone production server"

# 1. Create app directory
sudo mkdir -p "$APP_DIR"/{backups,scripts}
sudo chown -R "$(whoami)" "$APP_DIR"
cd "$APP_DIR"

# 2. Copy compose + scripts from repo (or download)
if [ ! -f docker-compose.prod.yml ]; then
  echo "==> ERROR: docker-compose.prod.yml not found"
  echo "   Copy these files to $APP_DIR:"
  echo "   - docker-compose.prod.yml"
  echo "   - .env.production.template → .env"
  echo "   - scripts/backup.sh"
  echo "   - scripts/uptime.sh"
  exit 1
fi

# 3. Create .env from template if not exists
if [ ! -f .env ]; then
  if [ -f .env.production.template ]; then
    cp .env.production.template .env
    echo "==> Created .env from template — EDIT IT NOW:"
    echo "   nano $APP_DIR/.env"
    echo ""
    echo "   Required changes:"
    echo "   - DB_PASSWORD: set a strong password"
    echo "   - JWT_SECRET: run 'openssl rand -hex 32'"
    echo "   - SMS_API_USERNAME/PASSWORD: from EasyThunder"
    echo "   - EASYSLIP_API_KEY: from EasySlip dashboard"
    echo "   - NEXT_PUBLIC_APP_URL: your domain"
    exit 1
  fi
fi

# 4. Pull images
echo "==> Pulling Docker images..."
docker pull "$IMAGE"
docker compose -f docker-compose.prod.yml pull

# 5. Start services
echo "==> Starting services..."
docker compose -f docker-compose.prod.yml up -d

# 6. Wait for health
echo "==> Waiting for services to be ready..."
for i in 1 2 3 4 5 6; do
  sleep 5
  if curl -sf http://localhost:3458/api/health/ready > /dev/null 2>&1; then
    echo "==> App is healthy!"
    break
  fi
  echo "   Attempt $i/6..."
done

# 7. Setup cron for backups and monitoring
echo "==> Setting up cron jobs..."
CRON_BACKUP="0 3 * * * cd $APP_DIR && ./scripts/backup.sh daily >> /var/log/smsok-backup.log 2>&1"
CRON_UPTIME="*/5 * * * * $APP_DIR/scripts/uptime.sh >> /var/log/smsok-uptime.log 2>&1"

(crontab -l 2>/dev/null | grep -v smsok; echo "$CRON_BACKUP"; echo "$CRON_UPTIME") | crontab -

echo "==> Setup complete!"
echo ""
echo "   App:     http://$(hostname -I | awk '{print $1}'):3458"
echo "   Health:  http://$(hostname -I | awk '{print $1}'):3458/api/health"
echo "   Backups: $APP_DIR/backups/ (daily at 3am)"
echo "   Logs:    docker compose -f docker-compose.prod.yml logs -f app"
