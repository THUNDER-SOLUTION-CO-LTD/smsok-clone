import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const invoiceNumberSource = readFileSync(
  resolve(ROOT, "lib/accounting/invoice-number.ts"),
  "utf-8",
);
const invoicePdfSource = readFileSync(
  resolve(ROOT, "lib/accounting/pdf/invoice-pdf.tsx"),
  "utf-8",
);
const generateInvoicePdfSource = readFileSync(
  resolve(ROOT, "lib/accounting/pdf/generate.ts"),
  "utf-8",
);
const orderPdfSource = readFileSync(resolve(ROOT, "lib/orders/pdf.ts"), "utf-8");

describe("Task #1889: PDF numbering and compliance hooks", () => {
  it("uses Thai accounting prefixes for credit and debit notes", () => {
    expect(invoiceNumberSource).toContain('CREDIT_NOTE: "CN"');
    expect(invoiceNumberSource).toContain('DEBIT_NOTE: "DN"');
  });

  it("adds verification URL + QR support to invoice PDFs", () => {
    expect(invoicePdfSource).toContain("verificationUrl?: string | null;");
    expect(invoicePdfSource).toContain("verificationQrDataUrl?: string | null;");
    expect(invoicePdfSource).toContain("<Image src={data.verificationQrDataUrl}");
    expect(invoicePdfSource).toContain("ตรวจสอบเอกสาร / Verification");
  });

  it("supports VOID watermark rendering in the invoice template", () => {
    expect(invoicePdfSource).toContain("isVoid?: boolean;");
    expect(invoicePdfSource).toContain(">VOID<");
  });

  it("hydrates verification assets for both direct invoice PDFs and order accounting PDFs", () => {
    expect(generateInvoicePdfSource).toContain("buildDocumentVerificationAssets");
    expect(generateInvoicePdfSource).toContain("verificationQrDataUrl");
    expect(orderPdfSource).toContain("buildDocumentVerificationAssets");
    expect(orderPdfSource).toContain("verificationUrl");
  });
});
