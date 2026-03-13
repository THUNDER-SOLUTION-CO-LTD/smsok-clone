import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const envSource = readFileSync(resolve(ROOT, "lib/env.ts"), "utf-8");
const r2Source = readFileSync(resolve(ROOT, "lib/storage/r2.ts"), "utf-8");
const storageFilesSource = readFileSync(resolve(ROOT, "lib/storage/files.ts"), "utf-8");
const storageServiceSource = readFileSync(resolve(ROOT, "lib/storage/service.ts"), "utf-8");
const storageRouteSource = readFileSync(resolve(ROOT, "app/api/storage/[...key]/route.ts"), "utf-8");
const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf-8");
const canonicalOrderSlipRoute = readFileSync(resolve(ROOT, "app/api/orders/[id]/slip/route.ts"), "utf-8");
const paymentUploadSlipRoute = readFileSync(resolve(ROOT, "app/api/payments/[id]/upload-slip/route.ts"), "utf-8");
const paymentVerifyRoute = readFileSync(resolve(ROOT, "app/api/payments/[id]/verify/route.ts"), "utf-8");
const paymentDetailRoute = readFileSync(resolve(ROOT, "app/api/payments/[id]/route.ts"), "utf-8");
const adminPaymentDetailRoute = readFileSync(resolve(ROOT, "app/api/admin/payments/[id]/route.ts"), "utf-8");
const topupVerifyRoute = readFileSync(resolve(ROOT, "app/api/v1/payments/topup/verify-slip/route.ts"), "utf-8");
const invoiceWhtRoute = readFileSync(resolve(ROOT, "app/api/v1/invoices/[id]/wht-cert/route.ts"), "utf-8");
const orderServiceSource = readFileSync(resolve(ROOT, "lib/orders/service.ts"), "utf-8");

describe("Task #2665: R2 storage migration", () => {
  it("adds R2 environment variables and storage helpers", () => {
    expect(envSource).toContain("R2_ENDPOINT");
    expect(envSource).toContain("R2_BUCKET");
    expect(envSource).toContain("R2_ACCESS_KEY_ID");
    expect(envSource).toContain("R2_SECRET_ACCESS_KEY");
    expect(storageFilesSource).toContain('const STORED_FILE_PREFIX = "r2:"');
    expect(storageFilesSource).toContain('const STORAGE_PROXY_PREFIX = "/api/storage"');
    expect(storageServiceSource).toContain("storeUploadedFile");
    expect(storageServiceSource).toContain("storeBufferInR2");
    expect(storageServiceSource).toContain("resolveStoredFileVerificationUrl");
    expect(r2Source).toContain("getSignedDownloadUrlFromR2");
    expect(r2Source).toContain("forcePathStyle: true");
  });

  it("stores order and payment uploads in R2 instead of DB data URLs", () => {
    expect(canonicalOrderSlipRoute).toContain("storeUploadedFile");
    expect(canonicalOrderSlipRoute).not.toContain("buildSlipDataUrl");
    expect(canonicalOrderSlipRoute).toContain("StorageUploadError");

    expect(paymentUploadSlipRoute).toContain("storeUploadedFile");
    expect(paymentUploadSlipRoute).not.toContain("fileToDataUrl");
    expect(paymentUploadSlipRoute).toContain("resolveStoredFileUrl(uploadedSlip.ref)");

    expect(topupVerifyRoute).toContain("storeBufferInR2");
    expect(topupVerifyRoute).toContain("slipUrl: storedSlip.ref");
    expect(topupVerifyRoute).not.toContain("slipUrl: upload.slipUrl");
    expect(topupVerifyRoute).not.toContain("verifyTopupSlipSchema");
    expect(topupVerifyRoute).not.toContain('Buffer.from(parsedSlip.payload, "base64")');
    expect(invoiceWhtRoute).toContain("storeUploadedFile");
    expect(invoiceWhtRoute).toContain("fileUrl: uploadedFile.ref");
    expect(invoiceWhtRoute).not.toContain("fileUrl: input.fileUrl");
    expect(storageServiceSource).not.toContain('storage: "inline"');
    expect(storageServiceSource).not.toContain("falling back to inline data URL");
    expect(storageServiceSource).not.toContain("storeBase64File");
  });

  it("reads stored files back for verification and proxy delivery", () => {
    expect(paymentVerifyRoute).toContain("resolveStoredFileVerificationUrl(payment.slipUrl)");
    expect(paymentVerifyRoute).toContain("verifySlipByUrl(verificationSource)");
    expect(storageRouteSource).toContain("readStoredFile");
    expect(storageRouteSource).toContain("authenticateAdmin(req)");
    expect(storageRouteSource).toContain("getStoredFileOwnerId(key)");
    expect(middlewareSource).toContain('if (pathname.startsWith("/api/storage/")) return false;');
  });

  it("resolves stored refs to proxy URLs in API responses", () => {
    expect(orderServiceSource).toContain("resolveStoredFileUrl(order.slipUrl)");
    expect(orderServiceSource).toContain("resolveStoredFileUrl(order.whtCertUrl)");
    expect(orderServiceSource).toContain("resolveStoredFileUrl(slip.fileUrl)");
    expect(paymentDetailRoute).toContain("resolveStoredFileUrl(data.slipUrl)");
    expect(paymentDetailRoute).toContain("resolveStoredFileUrl(data.whtCertUrl)");
    expect(adminPaymentDetailRoute).toContain("resolveStoredFileUrl(payment.slipUrl)");
    expect(invoiceWhtRoute).toContain("resolveStoredFileUrl(certificate.fileUrl)");
  });
});
