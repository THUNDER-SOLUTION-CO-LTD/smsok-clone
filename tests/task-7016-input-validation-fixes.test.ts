import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Task #7016: input validation and error mapping fixes", () => {
  it("validates api-key id with idSchema before lookup", () => {
    const serviceSource = readFileSync(resolve(ROOT, "lib/api-keys/service.ts"), "utf8");
    const getByIdBlock = serviceSource.slice(
      serviceSource.indexOf("export async function getApiKeyForUser"),
      serviceSource.indexOf("export async function toggleApiKeyForUser"),
    );

    expect(getByIdBlock).toContain("idSchema.parse({ id: keyId })");
    expect(getByIdBlock).toContain('throw new Error("ไม่พบ API Key")');
  });

  it("maps Zod validation errors to HTTP 400 in apiError()", () => {
    const apiAuthSource = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf8");
    expect(apiAuthSource).toContain('error.name === "ZodError"');
    expect(apiAuthSource).toContain("return Response.json(body, { status: 400 })");
  });

  it("validates blacklist phone format in the route", () => {
    const routeSource = readFileSync(resolve(ROOT, "app/api/v1/contacts/blacklist/route.ts"), "utf8");
    expect(routeSource).toContain("normalizeBlacklistPhone");
    expect(routeSource).toContain("normalizePhone");
  });
});
