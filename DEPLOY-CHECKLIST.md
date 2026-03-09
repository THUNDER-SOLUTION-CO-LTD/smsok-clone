# SMSOK Clone Deploy Checklist

## Code Baseline

- Runtime: Next.js 16 app with `output: "standalone"` in `next.config.ts`
- Package manager: Bun lockfile is present; use `bun install --frozen-lockfile` when Bun exists on the server
- Database: Prisma 6 + PostgreSQL via `DATABASE_URL`
- Core build commands:
  - `bun install --frozen-lockfile`
  - `bun run build`
  - `bunx prisma db push --accept-data-loss` only when schema drift has already been approved

## Files Reviewed

- `package.json`
- `next.config.ts`
- `prisma/schema.prisma`
- `.env.production.template`

## Required Production Environment Variables

Fill these in `/opt/smsok-clone/.env` from [.env.production.template](/Users/lambogreny/oracles/smsok-clone/.env.production.template):

- `DATABASE_URL`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `REDIS_URL`
- `JWT_SECRET`
- `CRON_SECRET`
- `OTP_HASH_SECRET`
- `OTP_BYPASS_CODE`
- `NEXTAUTH_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SECURE`
- `EASYTHUNDER_API_KEY`
- `SMS_API_URL`
- `SMS_API_USERNAME`
- `SMS_API_PASSWORD`
- `EASYSLIP_API_KEY`
- `EASYSLIP_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `WATCHTOWER_TOKEN`
- `DOCKER_CONFIG_PATH`
- `WATCHTOWER_NOTIFY_URL`

## Pre-Deploy Checks

- SSH access to `root@103.114.203.44`
- Confirm real app path on server
- Confirm `bun`, `pm2`, `git`, and PostgreSQL client tools exist on server
- Confirm `.env` exists on server and required vars above are filled
- Confirm database backup exists before any schema sync
- Confirm current branch/revision to deploy
- Cloudflare SSL mode: use `Full` or ideally `Full (strict)`, not `Flexible`

## Manual Deploy Sequence

Run only after SSH access is restored:

```bash
cd /path/to/smsok-clone
git pull origin main

if command -v bun >/dev/null 2>&1 && [ -f bun.lock ]; then
  bun install --frozen-lockfile
  bunx prisma db push --accept-data-loss
  bun run build
else
  npm ci
  npx prisma db push --accept-data-loss
  npm run build
fi

pm2 restart smsok || pm2 start npm --name smsok -- start
curl -fsS http://localhost:3000/api/health
```

## Current Blocker

- Current server SSH is working for `root@103.114.203.44`
- Domain `smsok.9phum.me` currently returns Cloudflare `521`, so the origin service stack is not up yet
