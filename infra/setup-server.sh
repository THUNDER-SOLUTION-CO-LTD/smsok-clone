#!/bin/bash
# SMSOK Clone — Server Bootstrap Script
# Run on fresh server: curl -fsSL <url> | bash
# Or: scp setup-server.sh root@103.114.203.44: && ssh root@103.114.203.44 'bash setup-server.sh'
set -euo pipefail

DOMAIN="smsok.9phum.me"
APP_DIR="/opt/smsok-clone"
BACKUP_DIR="/opt/smsok-backups"

log() { printf '==> %s\n' "$1"; }

# ─── 1. Base packages ───
log "Installing base packages"
apt-get update -qq
apt-get install -y -qq ca-certificates curl git gnupg ufw nginx certbot python3-certbot-nginx

# ─── 2. Docker ───
if ! command -v docker &>/dev/null; then
  log "Installing Docker"
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# ─── 3. Firewall ───
log "Configuring UFW"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ─── 4. App + log directories ───
log "Setting up directories"
mkdir -p "$APP_DIR" "$BACKUP_DIR" /var/log/smsok

# ─── 5. SSL + Nginx ───
log "Setting up SSL + Nginx via ssl-setup.sh"
if [ -f "$APP_DIR/infra/ssl-setup.sh" ]; then
  chmod +x "$APP_DIR/infra/ssl-setup.sh"
  bash "$APP_DIR/infra/ssl-setup.sh" "$DOMAIN" admin@9phum.me
else
  log "ssl-setup.sh not found — manual SSL setup needed"
  log "Run: certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
fi

# ─── 7. Logrotate ───
log "Installing logrotate config"
if [ -f "$APP_DIR/infra/logrotate.conf" ]; then
  cp "$APP_DIR/infra/logrotate.conf" /etc/logrotate.d/smsok
fi

# ─── 8. Cron jobs (backup + monitoring + error alerting) ───
log "Setting up cron jobs"
chmod +x "$APP_DIR/infra/backup.sh" "$APP_DIR/infra/monitor.sh" "$APP_DIR/infra/uptime-check.sh" "$APP_DIR/infra/error-alert.sh"
(crontab -l 2>/dev/null; \
  echo "0 3 * * * $APP_DIR/infra/backup.sh >> /var/log/smsok-backup.log 2>&1"; \
  echo "*/5 * * * * $APP_DIR/infra/monitor.sh >> /var/log/smsok-monitor.log 2>&1"; \
  echo "*/5 * * * * $APP_DIR/infra/uptime-check.sh >> /var/log/smsok-uptime.log 2>&1"; \
  echo "*/5 * * * * $APP_DIR/infra/error-alert.sh >> /var/log/smsok-monitor.log 2>&1" \
) | sort -u | crontab -

# ─── 9. Docker login for GHCR ───
log "Docker login to GHCR (you'll need a GitHub PAT with packages:read)"
echo "Run: echo '<GITHUB_PAT>' | docker login ghcr.io -u lambogreny --password-stdin"

# ─── 10. Summary ───
log "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Create .env file:  cp $APP_DIR/.env.production.template $APP_DIR/.env"
echo "  2. Edit .env:         nano $APP_DIR/.env  (fill in all CHANGE_ME values)"
echo "  3. Docker login:      echo '<PAT>' | docker login ghcr.io -u lambogreny --password-stdin"
echo "  4. Deploy:            cd $APP_DIR && docker compose -f docker-compose.prod.yml --env-file .env up -d"
echo "  5. Run migration:     docker compose exec app npx prisma migrate deploy"
echo "  6. Run seed:          docker compose exec app npx prisma db seed"
echo "  7. Verify:            curl https://$DOMAIN/api/health"
echo ""
echo "Cron jobs installed:"
echo "  0 3 * * *   — Daily DB backup"
echo "  */5 * * * * — Monitor (health, disk, memory, containers)"
echo "  */5 * * * * — Uptime check"
echo ""
echo "GitHub Actions secrets needed:"
echo "  SSH_HOST=103.114.203.44"
echo "  SSH_PRIVATE_KEY=<private key>"
echo "  WATCHTOWER_TOKEN=<from .env>"
