#!/bin/bash
# SMSOK — Cloudflare R2 Setup & Verification
# Creates buckets and tests read/write access
# Usage: ./infra/r2-setup.sh
# Requires: aws cli (brew install awscli)
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { printf '[%s] %s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$1"; }

echo "=== SMSOK — Cloudflare R2 Setup ==="
echo ""

# ── 1. Check required env vars ──
REQUIRED=(R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_ENDPOINT)
MISSING=0
for var in "${REQUIRED[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo -e "  ${RED}MISSING${NC} $var"
    MISSING=$((MISSING + 1))
  else
    echo -e "  ${GREEN}SET${NC}    $var"
  fi
done

if [ $MISSING -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}Set R2 env vars first. See .env.example${NC}"
  exit 1
fi

# ── 2. Check aws cli ──
if ! command -v aws &> /dev/null; then
  echo -e "${RED}aws CLI not found. Install: brew install awscli${NC}"
  exit 1
fi

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

# ── 3. Test connectivity ──
log "Testing R2 connectivity..."
if aws s3 ls --endpoint-url "$R2_ENDPOINT" > /dev/null 2>&1; then
  echo -e "  ${GREEN}Connected to R2${NC}"
else
  echo -e "  ${RED}Cannot connect to R2${NC}"
  exit 1
fi

# ── 4. Create buckets ──
BUCKETS=(${R2_BUCKET_SLIPS:-smsok-slips} ${R2_BUCKET_DOCS:-smsok-docs})

log "Creating buckets..."
for bucket in "${BUCKETS[@]}"; do
  if aws s3 ls "s3://$bucket" --endpoint-url "$R2_ENDPOINT" > /dev/null 2>&1; then
    echo -e "  ${GREEN}EXISTS${NC}  $bucket"
  else
    if aws s3 mb "s3://$bucket" --endpoint-url "$R2_ENDPOINT" 2>/dev/null; then
      echo -e "  ${GREEN}CREATED${NC} $bucket"
    else
      echo -e "  ${RED}FAILED${NC}  $bucket"
    fi
  fi
done

# ── 5. Write/read test ──
log "Testing read/write..."
TEST_FILE=$(mktemp)
echo "r2-test-$(date +%s)" > "$TEST_FILE"

for bucket in "${BUCKETS[@]}"; do
  printf "  %-20s" "$bucket"
  if aws s3 cp "$TEST_FILE" "s3://$bucket/.health-check" --endpoint-url "$R2_ENDPOINT" > /dev/null 2>&1; then
    # Read back
    if aws s3 cp "s3://$bucket/.health-check" /dev/null --endpoint-url "$R2_ENDPOINT" > /dev/null 2>&1; then
      echo -e "${GREEN}READ/WRITE OK${NC}"
    else
      echo -e "${YELLOW}WRITE OK, READ FAIL${NC}"
    fi
    # Cleanup
    aws s3 rm "s3://$bucket/.health-check" --endpoint-url "$R2_ENDPOINT" > /dev/null 2>&1
  else
    echo -e "${RED}WRITE FAIL${NC}"
  fi
done
rm -f "$TEST_FILE"

# ── 6. CORS config (needed for browser uploads) ──
log "Setting CORS policy on slips bucket..."
CORS_FILE=$(mktemp)
cat > "$CORS_FILE" << 'CORS'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
CORS

SLIPS_BUCKET="${R2_BUCKET_SLIPS:-smsok-slips}"
if aws s3api put-bucket-cors --bucket "$SLIPS_BUCKET" --cors-configuration "file://$CORS_FILE" --endpoint-url "$R2_ENDPOINT" 2>/dev/null; then
  echo -e "  ${GREEN}CORS set on $SLIPS_BUCKET${NC}"
else
  echo -e "  ${YELLOW}CORS setup skipped (may need Cloudflare dashboard)${NC}"
fi
rm -f "$CORS_FILE"

echo ""
log "R2 setup complete!"
echo ""
echo "  Slips bucket: ${R2_BUCKET_SLIPS:-smsok-slips}"
echo "  Docs bucket:  ${R2_BUCKET_DOCS:-smsok-docs}"
echo "  Endpoint:     $R2_ENDPOINT"
[ -n "${R2_PUBLIC_URL:-}" ] && echo "  Public URL:   $R2_PUBLIC_URL"
