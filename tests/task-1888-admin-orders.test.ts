import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const adminOrdersRoute = readFileSync(resolve(ROOT, "app/api/admin/orders/route.ts"), "utf-8");
const adminOrderStatsRoute = readFileSync(resolve(ROOT, "app/api/admin/orders/stats/route.ts"), "utf-8");
const adminOrderApproveRoute = readFileSync(resolve(ROOT, "app/api/admin/orders/[id]/approve/route.ts"), "utf-8");
const adminOrderRejectRoute = readFileSync(resolve(ROOT, "app/api/admin/orders/[id]/reject/route.ts"), "utf-8");
const adminOrdersPage = readFileSync(resolve(ROOT, "app/admin/orders/page.tsx"), "utf-8");

describe("Task #1888: admin order review endpoints", () => {
  it("adds admin list and stats endpoints used by the admin orders page", () => {
    expect(adminOrdersRoute).toContain("export async function GET");
    expect(adminOrdersRoute).toContain("authenticateAdmin(req)");
    expect(adminOrdersRoute).toContain("orders: orders.map(serializeOrder)");
    expect(adminOrdersRoute).toContain("pending_review");
    expect(adminOrderStatsRoute).toContain("export async function GET");
    expect(adminOrderStatsRoute).toContain("pending_review");
  });

  it("adds approve and reject handlers for admin review actions", () => {
    expect(adminOrderApproveRoute).toContain('status: "PAID"');
    expect(adminOrderApproveRoute).toContain("activateOrderPurchase");
    expect(adminOrderApproveRoute).toContain("ensureOrderDocument(tx, order, \"TAX_INVOICE\")");
    expect(adminOrderRejectRoute).toContain('status: "CANCELLED"');
    expect(adminOrderRejectRoute).toContain("rejectReason: reason");
    expect(adminOrderRejectRoute).toContain("Order rejected:");
  });

  it("matches the frontend admin orders page contract", () => {
    expect(adminOrdersPage).toContain('fetch(`/api/admin/orders?${params.toString()}`');
    expect(adminOrdersPage).toContain('fetch("/api/admin/orders/stats"');
    expect(adminOrdersPage).toContain('fetch(`/api/admin/orders/${orderId}/approve`');
    expect(adminOrdersPage).toContain('fetch(`/api/admin/orders/${orderId}/reject`');
  });
});
