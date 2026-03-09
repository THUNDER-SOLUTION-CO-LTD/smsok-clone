#!/bin/bash
set -euo pipefail

SERVER="${SERVER_HOST:-103.114.203.44}"
USER="${SERVER_USER:-root}"
APP_DIR="${APP_DIR:-/opt/smsok-clone}"
REPO_URL="${REPO_URL:-https://github.com/lambogreny/smsok-clone.git}"
DOMAIN="${DOMAIN:-smsok.9phum.me}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"

REQUIRED_ENV_VARS=(
  DATABASE_URL
  JWT_SECRET
  OTP_HASH_SECRET
  OTP_BYPASS_CODE
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  NEXT_PUBLIC_APP_URL
  EASYTHUNDER_API_KEY
)

log() {
  printf '==> %s\n' "$1"
}

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

remote() {
  ssh \
    -o BatchMode=yes \
    -o ConnectTimeout=8 \
    "$USER@$SERVER" \
    "$@"
}

check_ssh() {
  log "Checking SSH access to $USER@$SERVER"
  remote "echo OK" >/dev/null || fail "SSH failed for $USER@$SERVER"
  log "SSH: PASS"
}

bootstrap_server() {
  log "Installing base packages and Docker if needed"
  remote "
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl git gnupg ufw
    if ! command -v docker >/dev/null 2>&1; then
      curl -fsSL https://get.docker.com | sh
      systemctl enable docker
      systemctl start docker
    fi
  "
}

prepare_repo() {
  log "Preparing repo at $APP_DIR"
  remote "
    set -euo pipefail
    mkdir -p '$APP_DIR'
    if [ -d '$APP_DIR/.git' ]; then
      cd '$APP_DIR'
      git fetch origin main
      git checkout main
      git pull origin main
    else
      rm -rf '$APP_DIR'
      git clone '$REPO_URL' '$APP_DIR'
    fi
  "
}

prepare_env() {
  log "Preparing $ENV_FILE"
  remote "
    set -euo pipefail
    cd '$APP_DIR'
    if [ ! -f '$ENV_FILE' ]; then
      cp .env.production.template '$ENV_FILE'
    fi

    python3 - <<'PY'
from pathlib import Path

env_path = Path('$ENV_FILE')
text = env_path.read_text()
updates = {
    'NEXTAUTH_URL': 'https://$DOMAIN',
    'NEXT_PUBLIC_APP_URL': 'https://$DOMAIN',
}

for key, value in updates.items():
    line = f'{key}=\"{value}\"'
    if f'{key}=' in text:
        import re
        text = re.sub(rf'^{key}=.*$', line, text, flags=re.M)
    else:
        text += f'\\n{line}\\n'

env_path.write_text(text)
PY
  "
}

check_remote_env() {
  log "Checking required env vars in $ENV_FILE"

  local missing=()
  local name

  remote "test -f '$ENV_FILE'" >/dev/null || fail "Missing env file: $ENV_FILE"

  for name in "${REQUIRED_ENV_VARS[@]}"; do
    if ! remote "grep -Eq '^${name}=' '$ENV_FILE'"; then
      missing+=("$name")
    fi
  done

  if [ "${#missing[@]}" -gt 0 ]; then
    fail "Missing env vars on server: ${missing[*]}"
  fi

  log "Env vars: PASS"
}

deploy_remote() {
  log "Deploying Docker stack in $APP_DIR"
  remote "
    set -euo pipefail
    cd '$APP_DIR'
    docker compose --env-file '$ENV_FILE' -f docker-compose.prod.yml pull
    docker compose --env-file '$ENV_FILE' -f docker-compose.prod.yml up -d
    curl -fsS http://localhost:3458/api/health
  "
  log "Deploy: PASS"
}

main() {
  check_ssh
  bootstrap_server
  prepare_repo
  prepare_env
  check_remote_env
  deploy_remote
}

main \"$@\"
