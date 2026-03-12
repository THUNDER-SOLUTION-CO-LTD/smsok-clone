#!/bin/bash
# SMSOK — SSL Certificate Setup (Let's Encrypt + Certbot)
# Usage: ./infra/ssl-setup.sh <domain> [email]
# Example: ./infra/ssl-setup.sh smsok.9phum.me admin@9phum.me
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-admin@9phum.me}"
NGINX_CONF="/etc/nginx/sites-available/smsok"
APP_DIR="/opt/smsok-clone"

log() { printf '==> %s\n' "$1"; }
err() { printf 'ERROR: %s\n' "$1" >&2; exit 1; }

if [ -z "$DOMAIN" ]; then
  err "Usage: $0 <domain> [email]"
fi

# ── 1. Install certbot if needed ──
if ! command -v certbot &>/dev/null; then
  log "Installing certbot..."
  apt-get update -qq
  apt-get install -y -qq certbot python3-certbot-nginx
fi

# ── 2. Prepare ACME challenge dir ──
mkdir -p /var/www/certbot

# ── 3. Install nginx config with domain placeholder replaced ──
log "Installing Nginx config for $DOMAIN"
if [ -f "$APP_DIR/infra/nginx.conf" ]; then
  sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$APP_DIR/infra/nginx.conf" > "$NGINX_CONF"
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/smsok
  rm -f /etc/nginx/sites-enabled/default
fi

# ── 4. Temporary HTTP-only config for initial cert ──
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  log "No existing cert — creating HTTP-only config for initial cert request"
  cat > /tmp/nginx-http-only.conf << HTTPEOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 'waiting for SSL setup'; }
}
HTTPEOF
  cp /tmp/nginx-http-only.conf "$NGINX_CONF"
  nginx -t && systemctl reload nginx

  # ── 5. Request certificate ──
  log "Requesting SSL certificate for $DOMAIN"
  certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --no-eff-email

  if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    err "Certificate request failed! Check DNS A record points to this server."
  fi
  log "Certificate obtained!"
fi

# ── 6. Install full nginx config ──
log "Installing full HTTPS Nginx config"
sed "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$APP_DIR/infra/nginx.conf" > "$NGINX_CONF"

# Test and reload
if nginx -t; then
  systemctl reload nginx
  log "Nginx reloaded with SSL"
else
  err "Nginx config test failed! Check: nginx -t"
fi

# ── 7. Setup auto-renewal cron ──
log "Setting up auto-renewal"
(crontab -l 2>/dev/null; echo "0 3 1,15 * * certbot renew --quiet --post-hook 'systemctl reload nginx' >> /var/log/certbot-renew.log 2>&1") | sort -u | crontab -

# ── 8. Verify ──
log "Verifying certificate..."
CERT_EXPIRY=$(openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -noout -enddate | cut -d= -f2)
log "Certificate valid until: $CERT_EXPIRY"

echo ""
log "SSL setup complete!"
echo "  Domain:  https://$DOMAIN"
echo "  Cert:    /etc/letsencrypt/live/$DOMAIN/"
echo "  Renewal: cron — 1st & 15th of each month at 3AM"
echo "  Test:    curl -I https://$DOMAIN"
