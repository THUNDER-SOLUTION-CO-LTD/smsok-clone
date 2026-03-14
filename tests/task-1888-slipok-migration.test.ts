import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Task #1888 — SlipOK migration for order system", () => {
  describe("lib/slipok.ts adapter", () => {
    it("should exist and export verifySlipByUrl", () => {
      const slipokPath = path.resolve("lib/slipok.ts");
      expect(fs.existsSync(slipokPath)).toBe(true);

      const content = fs.readFileSync(slipokPath, "utf-8");
      expect(content).toContain("export async function verifySlipByUrl");
      expect(content).toContain("SLIPOK_API_KEY");
      expect(content).toContain("SLIPOK_BRANCH_ID");
    });

    it("should use FormData upload to SlipOK API", () => {
      const content = fs.readFileSync(path.resolve("lib/slipok.ts"), "utf-8");
      expect(content).toContain("FormData");
      expect(content).toContain("x-authorization");
      expect(content).toContain("api.slipok.com");
    });

    it("should handle SlipOK error codes 1012, 1013, 1014", () => {
      const content = fs.readFileSync(path.resolve("lib/slipok.ts"), "utf-8");
      expect(content).toContain('"1012"');
      expect(content).toContain('"1013"');
      expect(content).toContain('"1014"');
    });

    it("should accept expectedAmount parameter", () => {
      const content = fs.readFileSync(path.resolve("lib/slipok.ts"), "utf-8");
      expect(content).toContain("expectedAmount");
      expect(content).toContain('formData.append("amount"');
    });
  });

  describe("lib/easyslip.ts still exists (used by topup flow)", () => {
    it("should exist and export verifySlipByUrl and SlipVerifyResult type", () => {
      const easyslipPath = path.resolve("lib/easyslip.ts");
      expect(fs.existsSync(easyslipPath)).toBe(true);

      const content = fs.readFileSync(easyslipPath, "utf-8");
      expect(content).toContain("export async function verifySlipByUrl");
      expect(content).toContain("export type SlipVerifyResult");
    });
  });

  describe("order slip verification uses SlipOK", () => {
    it("imports verifySlipByUrl from slipok, not easyslip", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain('from "@/lib/slipok"');
      expect(content).not.toContain('verifySlipByUrl } from "@/lib/easyslip"');
    });

    it("passes expectedAmount to verifySlipByUrl", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain("verifySlipByUrl(publicUrl, expectedAmount)");
    });

    it("queues verification via worker, not inline", () => {
      const routePath = path.resolve("app/api/orders/[id]/slip/route.ts");
      const content = fs.readFileSync(routePath, "utf-8");
      expect(content).toContain('from "@/lib/queue/queues"');
      expect(content).toContain("slipVerifyQueue.add");
    });

    it("auto-pays on successful verification", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain('"PAID"');
      expect(content).toContain("activateOrderPurchase");
      expect(content).toContain("ensureOrderDocument");
      expect(content).toContain("SlipOK verified");
    });

    it("supports pending manual review fallback", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain("getPendingReviewMessage");
      expect(content).toContain("getManualReviewNote");
      expect(content).toContain('status: "VERIFYING"');
      expect(content).toContain("manual_review");
    });

    it("still checks for duplicate transRef in DB", () => {
      const content = fs.readFileSync(path.resolve("lib/orders/slip-verification.ts"), "utf-8");
      expect(content).toContain("orderSlip.findFirst");
      expect(content).toContain("transRef");
    });
  });

  describe("upload route re-exports slip route", () => {
    it("v1 upload route should re-export from slip route", () => {
      const content = fs.readFileSync(
        path.resolve("app/api/v1/orders/[id]/upload/route.ts"),
        "utf-8",
      );
      expect(content).toContain("slip/route");
    });
  });

  describe("env configuration", () => {
    it("should have SLIPOK vars in env.ts schema", () => {
      const content = fs.readFileSync(path.resolve("lib/env.ts"), "utf-8");
      expect(content).toContain("SLIPOK_BRANCH_ID");
      expect(content).toContain("SLIPOK_API_KEY");
    });

    it("should have SLIPOK vars in .env.example", () => {
      const content = fs.readFileSync(path.resolve(".env.example"), "utf-8");
      expect(content).toContain("SLIPOK_BRANCH_ID");
      expect(content).toContain("SLIPOK_API_KEY");
    });

    it("should still have EasySlip vars (used by topup flow)", () => {
      const content = fs.readFileSync(path.resolve("lib/env.ts"), "utf-8");
      expect(content).toContain("EASYSLIP_API_KEY");
    });
  });
});
