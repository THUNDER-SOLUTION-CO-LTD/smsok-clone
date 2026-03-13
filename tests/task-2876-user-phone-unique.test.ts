import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const schemaSource = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const migrationSource = readFileSync(
  resolve(ROOT, "prisma/migrations/20260313194000_add_user_phone_unique/migration.sql"),
  "utf-8",
);
const registerActionsSource = readFileSync(resolve(ROOT, "lib/actions.ts"), "utf-8");
const otpActionsSource = readFileSync(resolve(ROOT, "lib/actions/otp.ts"), "utf-8");
const authActionsSource = readFileSync(resolve(ROOT, "lib/actions/auth.ts"), "utf-8");
const seedSource = readFileSync(resolve(ROOT, "prisma/seed.ts"), "utf-8");

describe("Task #2876: users.phone is enforced as a unique identifier", () => {
  it("marks User.phone unique in the Prisma schema without keeping the blank-string default", () => {
    expect(schemaSource).toContain("phone               String             @unique");
    expect(schemaSource).not.toContain('phone               String             @default("")');
  });

  it("guards the migration against blank or duplicate phone values before creating the unique index", () => {
    expect(migrationSource).toContain('WHERE "phone" = \'\'');
    expect(migrationSource).toContain('HAVING COUNT(*) > 1');
    expect(migrationSource).toContain('ALTER COLUMN "phone" DROP DEFAULT');
    expect(migrationSource).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key"');
  });

  it("switches phone lookups onto findUnique in registration and OTP flows", () => {
    expect(registerActionsSource).toContain('findUnique({ where: { phone }, select: { id: true } })');
    expect(otpActionsSource).toContain('findUnique({ where: { phone: normalizedPhone }, select: { id: true } })');
  });

  it("uses unique lookups for forgot-password phone matching while preserving the fallback format check", () => {
    expect(authActionsSource).toContain('findUnique({');
    expect(authActionsSource).toContain('where: { phone },');
    expect(authActionsSource).toContain('where: { phone: fallbackPhone }');
  });

  it("keeps prisma seed compatible by providing a phone for the seeded user", () => {
    expect(seedSource).toContain("DEFAULT_SEED_PHONE");
    expect(seedSource).toContain("phone: requestedPhone");
  });
});
