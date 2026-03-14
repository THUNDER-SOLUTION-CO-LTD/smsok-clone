import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const pdpaActionsSource = readFileSync(resolve(ROOT, "lib/actions/pdpa.ts"), "utf-8");
const meExportRouteSource = readFileSync(resolve(ROOT, "app/api/v1/me/export/route.ts"), "utf-8");
const meDeleteRouteSource = readFileSync(resolve(ROOT, "app/api/v1/me/delete/route.ts"), "utf-8");
const dataExportAliasSource = readFileSync(
  resolve(ROOT, "app/api/v1/user/data-export/route.ts"),
  "utf-8",
);
const dataDeleteAliasSource = readFileSync(
  resolve(ROOT, "app/api/v1/user/data-delete/route.ts"),
  "utf-8",
);

describe("Task #3228: self-service PDPA request endpoints", () => {
  it("adds self-service PDPA request helpers with duplicate protection", () => {
    expect(pdpaActionsSource).toContain("export async function listSelfServiceDataRequests");
    expect(pdpaActionsSource).toContain("export async function submitSelfServiceDataRequest");
    expect(pdpaActionsSource).toContain('status: { in: [...ACTIVE_SELF_SERVICE_STATUSES] }');
    expect(pdpaActionsSource).toContain("requestorEmail: user.email");
  });

  it("adds /api/v1/me/export to list and create portability requests", () => {
    expect(meExportRouteSource).toContain("export async function GET");
    expect(meExportRouteSource).toContain("export async function POST");
    expect(meExportRouteSource).toContain('submitSelfServiceDataRequest(user.id, user.organizationId, "PORTABILITY")');
    expect(meExportRouteSource).toContain('action: "pdpa.me.export.request"');
  });

  it("adds /api/v1/me/delete to list and create delete requests", () => {
    expect(meDeleteRouteSource).toContain("export async function GET");
    expect(meDeleteRouteSource).toContain("export async function POST");
    expect(meDeleteRouteSource).toContain("export async function DELETE");
    expect(meDeleteRouteSource).toContain('submitSelfServiceDataRequest(user.id, user.organizationId, "DELETE")');
    expect(meDeleteRouteSource).toContain('action: "pdpa.me.delete.request"');
  });

  it("keeps the legacy privacy-page aliases wired to the new routes", () => {
    expect(dataExportAliasSource).toContain('export { GET, POST } from "../../me/export/route";');
    expect(dataDeleteAliasSource).toContain('export { GET, POST, DELETE } from "../../me/delete/route";');
  });
});
