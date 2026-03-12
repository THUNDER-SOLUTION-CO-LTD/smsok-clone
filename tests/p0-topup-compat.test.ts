import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const packagesRoute = readFileSync(
  resolve(ROOT, "app/api/v1/payments/packages/route.ts"),
  "utf-8",
);
const bankAccountsRoute = readFileSync(
  resolve(ROOT, "app/api/v1/payments/bank-accounts/route.ts"),
  "utf-8",
);
const historyRoute = readFileSync(
  resolve(ROOT, "app/api/v1/payments/history/route.ts"),
  "utf-8",
);
const purchaseRoute = readFileSync(
  resolve(ROOT, "app/api/v1/payments/purchase/route.ts"),
  "utf-8",
);
const verifySlipRoute = readFileSync(
  resolve(ROOT, "app/api/v1/payments/topup/verify-slip/route.ts"),
  "utf-8",
);

describe("P0: topup compatibility flow", () => {
  it("maps active package tiers into the legacy topup card shape", () => {
    expect(packagesRoute).toContain("sms: tier.totalSms");
    expect(packagesRoute).toContain("perSms");
    expect(packagesRoute).toContain("bonusPercent");
    expect(packagesRoute).not.toContain("return apiResponse({ packages: tiers })");
  });

  it("returns the full company bank account payload used by legacy topup screens", () => {
    expect(bankAccountsRoute).toContain("accountType");
    expect(bankAccountsRoute).toContain("branch");
  });

  it("reads payment history from the Payment table instead of the removed gateway flow", () => {
    expect(historyRoute).toContain("db.payment.findMany");
    expect(historyRoute).toContain("transactions: items");
    expect(historyRoute).not.toContain("TODO: Re-implement with new payment provider");
  });

  it("resolves legacy purchase confirmations from Payment records", () => {
    expect(purchaseRoute).toContain("db.payment.findFirst");
    expect(purchaseRoute).toContain("transactionId: payment.id");
    expect(purchaseRoute).not.toContain("Endpoint deprecated");
  });

  it("verifies slips with EasySlip and persists through Payment + PaymentHistory", () => {
    expect(verifySlipRoute).toContain("verifySlipByBase64");
    expect(verifySlipRoute).toContain("tx.payment.create");
    expect(verifySlipRoute).toContain("tx.paymentHistory.create");
    expect(verifySlipRoute).toContain("tx.packagePurchase.create");
    expect(verifySlipRoute).not.toContain("verifyTopupSlip");
    expect(verifySlipRoute).not.toContain("transaction.create");
  });
});
