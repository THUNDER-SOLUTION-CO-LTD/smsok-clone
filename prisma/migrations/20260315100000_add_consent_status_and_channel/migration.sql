-- Add channel column to pdpa_consent_logs
ALTER TABLE "pdpa_consent_logs" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'WEB';

-- Create consent_statuses table (materialized consent status per user)
CREATE TABLE "consent_statuses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "is_consented" BOOLEAN NOT NULL DEFAULT false,
    "policy_version" TEXT NOT NULL,
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "consent_statuses_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one status per user per consent type
CREATE UNIQUE INDEX "consent_statuses_user_id_consent_type_key" ON "consent_statuses"("user_id", "consent_type");

-- Performance index for consent guard lookups
CREATE INDEX "consent_statuses_consent_type_is_consented_idx" ON "consent_statuses"("consent_type", "is_consented");

-- Foreign key
ALTER TABLE "consent_statuses" ADD CONSTRAINT "consent_statuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: populate consent_statuses from latest pdpa_consent_logs
INSERT INTO "consent_statuses" ("id", "user_id", "consent_type", "is_consented", "policy_version", "last_updated_at")
SELECT
    'cs_' || substr(md5(random()::text || clock_timestamp()::text), 1, 25),
    cl."user_id",
    cl."consent_type",
    CASE WHEN cl."action" = 'OPT_IN' THEN true ELSE false END,
    p."version",
    cl."recorded_at"
FROM "pdpa_consent_logs" cl
INNER JOIN "pdpa_policies" p ON p."id" = cl."policy_id"
INNER JOIN (
    SELECT "user_id", "consent_type", MAX("recorded_at") AS max_recorded
    FROM "pdpa_consent_logs"
    GROUP BY "user_id", "consent_type"
) latest ON cl."user_id" = latest."user_id"
    AND cl."consent_type" = latest."consent_type"
    AND cl."recorded_at" = latest.max_recorded
ON CONFLICT ("user_id", "consent_type") DO NOTHING;
