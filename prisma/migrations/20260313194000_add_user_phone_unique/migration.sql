DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE "phone" = ''
  ) THEN
    RAISE EXCEPTION 'Cannot add users_phone_key while blank phone values exist. Backfill phone numbers before running this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "users"
    GROUP BY "phone"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add users_phone_key while duplicate phone values exist. Clean duplicate users.phone values before running this migration.';
  END IF;
END $$;

ALTER TABLE "users"
  ALTER COLUMN "phone" DROP DEFAULT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key"
  ON "users"("phone");
