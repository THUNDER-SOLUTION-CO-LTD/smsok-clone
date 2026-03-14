#!/bin/bash
# SMSOK Production Server Setup — Run on 103.114.203.44
# Usage: ssh root@103.114.203.44 < infra/server-setup.sh
set -euo pipefail

echo "🚀 SMSOK Production Server Setup"
echo "================================="

# 1. Docker
echo "1/5 — Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "✅ Docker installed"
else
  echo "✅ Docker already installed"
fi

docker --version
docker compose version

# 2. Create deploy user
echo "2/5 — Creating deploy user..."
if ! id -u smsok &>/dev/null; then
  useradd -m -s /bin/bash -G docker smsok
  echo "✅ User 'smsok' created"
else
  usermod -aG docker smsok
  echo "✅ User 'smsok' already exists, added to docker group"
fi

# 3. Create app directory
echo "3/5 — Setting up app directory..."
mkdir -p /opt/smsok
chown smsok:smsok /opt/smsok
echo "✅ /opt/smsok ready"

# 4. SSL with certbot
echo "4/5 — Setting up SSL..."
if ! command -v certbot &>/dev/null; then
  apt-get update -qq
  apt-get install -y -qq certbot python3-certbot-nginx
  echo "✅ Certbot installed"
else
  echo "✅ Certbot already installed"
fi

# Check if cert exists
if [ ! -f /etc/letsencrypt/live/smsok.9phum.me/fullchain.pem ]; then
  echo "⚠️ SSL cert not found — run manually:"
  echo "  certbot --nginx -d smsok.9phum.me"
else
  echo "✅ SSL cert exists"
fi

# 5. GHCR login for pulling images
echo "5/5 — Docker registry setup..."
echo "⚠️ Login to GHCR manually:"
echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u lambogreny --password-stdin"

echo ""
echo "================================="
echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.production to /opt/smsok/.env"
echo "2. Copy docker-compose.prod.yml to /opt/smsok/docker-compose.yml"
echo "3. Login to GHCR"
echo "4. Run: cd /opt/smsok && docker compose up -d"
echo "5. Run: docker compose exec app npx prisma db push"
