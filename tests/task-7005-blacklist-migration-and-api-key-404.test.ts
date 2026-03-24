import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Task #7005: blacklist migration lands and api-key detail returns 404", () => {
  it("uses phone @unique in the schema for blacklist entries", () => {
    const schema = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf8");
    expect(schema).toContain("phone     String   @unique");
  });

  it("keeps server-only mocked globally for route-import regressions", () => {
    const setupSource = readFileSync(resolve(ROOT, "tests/setup.ts"), "utf8");
    expect(setupSource).toContain('vi.mock("server-only", () => ({}));');
  });
});
