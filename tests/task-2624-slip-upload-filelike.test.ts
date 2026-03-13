import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { coerceUploadedFile } from "@/lib/uploaded-file";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  orderFindFirst: vi.fn(),
  transaction: vi.fn(),
  orderSlipCreate: vi.fn(),
  orderUpdate: vi.fn(),
  verifySlipByUrl: vi.fn(),
  createOrderHistory: vi.fn(),
  storeUploadedFile: vi.fn(),
  removeStoredFile: vi.fn(),
  applyRateLimit: vi.fn(),
  resolveStoredFileVerificationUrl: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    order: {
      findFirst: mocks.orderFindFirst,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock("@/lib/easyslip", () => ({
  verifySlipByUrl: mocks.verifySlipByUrl,
}));

vi.mock("@/lib/orders/service", () => ({
  createOrderHistory: mocks.createOrderHistory,
  serializeOrder: vi.fn((value: unknown) => value),
  serializeOrderSlip: vi.fn((value: unknown) => value),
  serializeOrderV2: vi.fn((value: unknown) => value),
}));

vi.mock("@/lib/storage/service", () => ({
  storeUploadedFile: mocks.storeUploadedFile,
  removeStoredFile: mocks.removeStoredFile,
  resolveStoredFileVerificationUrl: mocks.resolveStoredFileVerificationUrl,
}));

vi.mock("@/lib/rate-limit", () => ({
  applyRateLimit: mocks.applyRateLimit,
}));

import { POST as uploadOrderSlip } from "@/app/api/v1/orders/[id]/upload/route";
import { POST as uploadCanonicalOrderSlip } from "@/app/api/orders/[id]/slip/route";

const slipFixture = readFileSync(resolve(__dirname, "fixtures/real-slip-test.jpg"));
const middlewareSource = readFileSync(resolve(__dirname, "..", "middleware.ts"), "utf-8");

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function createFileLikeSlip() {
  return {
    name: "real-slip-test.jpg",
    type: "image/jpeg",
    size: slipFixture.byteLength,
    arrayBuffer: vi.fn().mockResolvedValue(toArrayBuffer(slipFixture)),
  };
}

function createRequestWithSlip(slip: ReturnType<typeof createFileLikeSlip>) {
  return {
    formData: vi.fn().mockResolvedValue({
      get: (key: string) => (key === "slip" ? slip : null),
    }),
  } as unknown as Request;
}

const pendingOrder = {
  id: "order_1",
  userId: "user_1",
  organizationId: null,
  packageTierId: "tier_1",
  smsCount: 100,
  customerType: "INDIVIDUAL",
  payAmount: 100,
  hasWht: false,
  status: "PENDING_PAYMENT",
  expiresAt: new Date("2099-01-01T00:00:00.000Z"),
  whtCertUrl: null,
};

const verifyingOrder = {
  id: "order_1",
  orderNumber: "ORD-TEST-0001",
  packageTierId: "tier_1",
  packageName: "Starter",
  smsCount: 100,
  customerType: "INDIVIDUAL",
  taxName: "QA Tester",
  taxId: "1234567890123",
  taxAddress: "Bangkok",
  taxBranchType: "HEAD",
  taxBranchNumber: null,
  netAmount: 93.46,
  vatAmount: 6.54,
  totalAmount: 100,
  hasWht: false,
  whtAmount: 0,
  payAmount: 100,
  status: "VERIFYING",
  expiresAt: new Date("2099-01-01T00:00:00.000Z"),
  quotationNumber: null,
  quotationUrl: null,
  invoiceNumber: null,
  invoiceUrl: null,
  slipUrl: "r2:users/user_1/orders/order_1/slips/fixture.jpg",
  whtCertUrl: null,
  easyslipVerified: false,
  rejectReason: null,
  adminNote: null,
  paidAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date("2099-01-01T00:00:00.000Z"),
};

const createdSlip = {
  id: "slip_1",
  fileUrl: "r2:users/user_1/orders/order_1/slips/fixture.jpg",
  fileKey: "users/user_1/orders/order_1/slips/fixture.jpg",
  fileSize: slipFixture.byteLength,
  fileType: "image/jpeg",
  uploadedAt: new Date("2099-01-01T00:00:00.000Z"),
  verifiedAt: null,
  verifiedBy: null,
  deletedAt: null,
};

describe("Task #2624: slip upload accepts file-like multipart entries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ id: "user_1" });
    mocks.orderFindFirst.mockResolvedValue(pendingOrder);
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        orderSlip: {
          create: mocks.orderSlipCreate,
        },
        order: {
          update: mocks.orderUpdate,
        },
      }));
    mocks.orderSlipCreate.mockResolvedValue(createdSlip);
    mocks.orderUpdate.mockResolvedValue(verifyingOrder);
    mocks.verifySlipByUrl.mockResolvedValue({
      success: false,
      error: "EasySlip API key not configured",
    });
    mocks.applyRateLimit.mockResolvedValue({ blocked: null, headers: {} });
    mocks.resolveStoredFileVerificationUrl.mockResolvedValue("https://signed.example/slip.jpg");
    mocks.storeUploadedFile.mockResolvedValue({
      key: "users/user_1/orders/order_1/slips/fixture.jpg",
      ref: "r2:users/user_1/orders/order_1/slips/fixture.jpg",
      body: slipFixture,
      contentType: "image/jpeg",
      storage: "r2",
    });
    mocks.removeStoredFile.mockResolvedValue(undefined);
  });

  it("coerces multipart file-like entries even when they are not File instances", async () => {
    const slip = createFileLikeSlip();

    if (typeof File !== "undefined") {
      expect(slip).not.toBeInstanceOf(File);
    }

    const uploaded = coerceUploadedFile(slip as never);

    expect(uploaded).not.toBeNull();
    expect(uploaded?.name).toBe("real-slip-test.jpg");
    expect(uploaded?.type).toBe("image/jpeg");
    expect(uploaded?.size).toBe(slipFixture.byteLength);
  });

  it("stores the slip and returns VERIFYING on the v1 route when EasySlip is unavailable", async () => {
    const response = await uploadOrderSlip(createRequestWithSlip(createFileLikeSlip()), {
      params: Promise.resolve({ id: "order_1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "VERIFYING",
      verified: false,
      pending_review: true,
      review_note: "EasySlip: EasySlip API key not configured",
      latest_slip: {
        id: "slip_1",
      },
    });
    expect(mocks.verifySlipByUrl).toHaveBeenCalledTimes(1);
    expect(mocks.orderSlipCreate).toHaveBeenCalledTimes(1);
    expect(mocks.orderUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.storeUploadedFile).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        scope: "orders",
        resourceId: "order_1",
        kind: "slips",
      }),
    );
    expect(mocks.createOrderHistory).toHaveBeenCalledWith(
      expect.anything(),
      "order_1",
      "VERIFYING",
      expect.objectContaining({
        note: "EasySlip: EasySlip API key not configured",
      }),
    );
    expect(mocks.resolveStoredFileVerificationUrl).toHaveBeenCalledWith(
      "r2:users/user_1/orders/order_1/slips/fixture.jpg",
    );
    expect(mocks.verifySlipByUrl).toHaveBeenCalledWith("https://signed.example/slip.jpg");
  });

  it("stores the slip and returns VERIFYING on the canonical route when EasySlip is unavailable", async () => {
    const response = await uploadCanonicalOrderSlip(createRequestWithSlip(createFileLikeSlip()), {
      params: Promise.resolve({ id: "order_1" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "VERIFYING",
      verified: false,
      pending_review: true,
      review_note: "EasySlip: EasySlip API key not configured",
      latest_slip: {
        id: "slip_1",
      },
    });
    expect(mocks.verifySlipByUrl).toHaveBeenCalledTimes(1);
    expect(mocks.verifySlipByUrl).toHaveBeenCalledWith("https://signed.example/slip.jpg");
    expect(mocks.storeUploadedFile).toHaveBeenCalledTimes(1);
    expect(mocks.applyRateLimit).toHaveBeenCalledWith("user_1", "slip");
  });

  it("rewrites legacy v1 slip endpoints to the canonical slip route before the v1 middleware branch runs", () => {
    expect(middlewareSource).toContain("legacyOrderSlipMatch");
    expect(middlewareSource).toContain('rewriteUrl.pathname = `/api/orders/${legacyOrderSlipMatch[1]}/slip`');
    expect(middlewareSource).toContain('pathname.match(/^\\/api\\/v1\\/orders\\/([^/]+)\\/(?:upload|verify-slip)$/)');
  });
});
