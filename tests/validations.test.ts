import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
  sendSmsSchema,
  sendBatchSmsSchema,
  createContactSchema,
  updateContactSchema,
  createContactGroupSchema,
  addGroupMembersSchema,
  requestSenderNameSchema,
  approveSenderNameSchema,
  purchasePackageSchema,
  uploadSlipSchema,
  verifyTransactionSchema,
  createApiKeySchema,
  idSchema,
  paginationSchema,
  dateRangeSchema,
  reportFilterSchema,
  calculateSmsCount,
  calculateCreditCost,
  normalizePhone,
} from "@/lib/validations";

// ==========================================
// Auth Validations
// ==========================================

describe("registerSchema", () => {
  const valid = {
    name: "สมชาย ใจดี",
    email: "test@example.com",
    password: "Password1",
  };

  it("accepts valid registration", () => {
    const result = registerSchema.parse(valid);
    expect(result.name).toBe("สมชาย ใจดี");
    expect(result.email).toBe("test@example.com");
  });

  it("trims name whitespace", () => {
    const result = registerSchema.parse({ ...valid, name: "  สมชาย  " });
    expect(result.name).toBe("สมชาย");
  });

  it("lowercases email", () => {
    const result = registerSchema.parse({ ...valid, email: "Test@EXAMPLE.com" });
    expect(result.email).toBe("test@example.com");
  });

  it("rejects name < 2 chars", () => {
    expect(() => registerSchema.parse({ ...valid, name: "A" })).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => registerSchema.parse({ ...valid, email: "not-email" })).toThrow();
  });

  it("rejects password < 8 chars", () => {
    expect(() => registerSchema.parse({ ...valid, password: "Pass1" })).toThrow();
  });

  it("rejects password without uppercase", () => {
    expect(() => registerSchema.parse({ ...valid, password: "password1" })).toThrow();
  });

  it("rejects password without number", () => {
    expect(() => registerSchema.parse({ ...valid, password: "Password" })).toThrow();
  });

  it("accepts valid Thai phone", () => {
    const result = registerSchema.parse({ ...valid, phone: "0891234567" });
    expect(result.phone).toBe("0891234567");
  });

  it("rejects invalid phone format", () => {
    expect(() => registerSchema.parse({ ...valid, phone: "1234567890" })).toThrow();
  });

  it("phone is optional", () => {
    const result = registerSchema.parse(valid);
    expect(result.phone).toBeUndefined();
  });

  it("accepts phone starting with 06", () => {
    const result = registerSchema.parse({ ...valid, phone: "0612345678" });
    expect(result.phone).toBe("0612345678");
  });

  it("accepts phone starting with 09", () => {
    const result = registerSchema.parse({ ...valid, phone: "0912345678" });
    expect(result.phone).toBe("0912345678");
  });

  it("rejects phone starting with 01", () => {
    expect(() => registerSchema.parse({ ...valid, phone: "0112345678" })).toThrow();
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.parse({ email: "test@example.com", password: "pass" });
    expect(result.email).toBe("test@example.com");
  });

  it("rejects empty password", () => {
    expect(() => loginSchema.parse({ email: "test@example.com", password: "" })).toThrow();
  });

  it("lowercases email", () => {
    const result = loginSchema.parse({ email: "TEST@Example.com", password: "pass" });
    expect(result.email).toBe("test@example.com");
  });
});

describe("changePasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = changePasswordSchema.parse({
      currentPassword: "old",
      newPassword: "NewPass1",
      confirmPassword: "NewPass1",
    });
    expect(result.newPassword).toBe("NewPass1");
  });

  it("rejects non-matching confirm", () => {
    expect(() =>
      changePasswordSchema.parse({
        currentPassword: "old",
        newPassword: "NewPass1",
        confirmPassword: "Different1",
      })
    ).toThrow("รหัสผ่านไม่ตรงกัน");
  });
});

// ==========================================
// SMS Validations
// ==========================================

describe("sendSmsSchema", () => {
  const valid = {
    senderName: "MYSHOP",
    recipient: "0891234567",
    message: "สวัสดีครับ",
  };

  it("accepts valid SMS data", () => {
    const result = sendSmsSchema.parse(valid);
    expect(result.senderName).toBe("MYSHOP");
  });

  it("rejects sender < 3 chars", () => {
    expect(() => sendSmsSchema.parse({ ...valid, senderName: "AB" })).toThrow();
  });

  it("rejects sender > 11 chars", () => {
    expect(() => sendSmsSchema.parse({ ...valid, senderName: "ABCDEFGHIJKL" })).toThrow();
  });

  it("rejects sender with special chars", () => {
    expect(() => sendSmsSchema.parse({ ...valid, senderName: "MY-SHOP" })).toThrow();
  });

  it("rejects sender with Thai chars", () => {
    expect(() => sendSmsSchema.parse({ ...valid, senderName: "ร้านค้า" })).toThrow();
  });

  it("rejects invalid phone", () => {
    expect(() => sendSmsSchema.parse({ ...valid, recipient: "1234567890" })).toThrow();
  });

  it("rejects empty message", () => {
    expect(() => sendSmsSchema.parse({ ...valid, message: "" })).toThrow();
  });

  it("rejects message > 1000 chars", () => {
    expect(() => sendSmsSchema.parse({ ...valid, message: "A".repeat(1001) })).toThrow();
  });

  it("accepts message at 1000 chars exactly", () => {
    const result = sendSmsSchema.parse({ ...valid, message: "A".repeat(1000) });
    expect(result.message).toHaveLength(1000);
  });
});

describe("sendBatchSmsSchema", () => {
  it("accepts valid batch data", () => {
    const result = sendBatchSmsSchema.parse({
      senderName: "MYSHOP",
      recipients: ["0891234567", "0891234568"],
      message: "Hello",
    });
    expect(result.recipients).toHaveLength(2);
  });

  it("rejects empty recipients", () => {
    expect(() =>
      sendBatchSmsSchema.parse({
        senderName: "MYSHOP",
        recipients: [],
        message: "Hello",
      })
    ).toThrow();
  });

  it("rejects > 10000 recipients", () => {
    expect(() =>
      sendBatchSmsSchema.parse({
        senderName: "MYSHOP",
        recipients: Array(10001).fill("0891234567"),
        message: "Hello",
      })
    ).toThrow();
  });

  it("rejects invalid phone in batch", () => {
    expect(() =>
      sendBatchSmsSchema.parse({
        senderName: "MYSHOP",
        recipients: ["0891234567", "invalid"],
        message: "Hello",
      })
    ).toThrow();
  });
});

// ==========================================
// Contact Validations
// ==========================================

describe("createContactSchema", () => {
  it("accepts valid contact", () => {
    const result = createContactSchema.parse({
      name: "สมชาย",
      phone: "0891234567",
    });
    expect(result.name).toBe("สมชาย");
  });

  it("rejects empty name", () => {
    expect(() => createContactSchema.parse({ name: "", phone: "0891234567" })).toThrow();
  });

  it("accepts optional email", () => {
    const result = createContactSchema.parse({
      name: "Test",
      phone: "0891234567",
      email: "test@example.com",
    });
    expect(result.email).toBe("test@example.com");
  });

  it("accepts empty string email", () => {
    const result = createContactSchema.parse({
      name: "Test",
      phone: "0891234567",
      email: "",
    });
    expect(result.email).toBe("");
  });

  it("rejects invalid email", () => {
    expect(() =>
      createContactSchema.parse({ name: "Test", phone: "0891234567", email: "bad" })
    ).toThrow();
  });
});

describe("updateContactSchema", () => {
  it("accepts partial update", () => {
    const result = updateContactSchema.parse({ name: "New Name" });
    expect(result.name).toBe("New Name");
    expect(result.phone).toBeUndefined();
  });

  it("accepts empty object (no changes)", () => {
    const result = updateContactSchema.parse({});
    expect(Object.keys(result)).toHaveLength(0);
  });
});

describe("createContactGroupSchema", () => {
  it("accepts valid group name", () => {
    const result = createContactGroupSchema.parse({ name: "VIP Customers" });
    expect(result.name).toBe("VIP Customers");
  });

  it("rejects empty name", () => {
    expect(() => createContactGroupSchema.parse({ name: "" })).toThrow();
  });
});

describe("addGroupMembersSchema", () => {
  it("rejects empty contactIds", () => {
    expect(() => addGroupMembersSchema.parse({ contactIds: [] })).toThrow();
  });

  it("rejects non-cuid ids", () => {
    expect(() => addGroupMembersSchema.parse({ contactIds: ["not-cuid"] })).toThrow();
  });
});

// ==========================================
// Sender Name Validations
// ==========================================

describe("requestSenderNameSchema", () => {
  it("accepts valid name and uppercases", () => {
    const result = requestSenderNameSchema.parse({ name: "myshop" });
    expect(result.name).toBe("MYSHOP");
  });

  it("rejects name < 3 chars", () => {
    expect(() => requestSenderNameSchema.parse({ name: "AB" })).toThrow();
  });

  it("rejects name > 11 chars", () => {
    expect(() => requestSenderNameSchema.parse({ name: "ABCDEFGHIJKL" })).toThrow();
  });

  it("rejects special characters", () => {
    expect(() => requestSenderNameSchema.parse({ name: "MY-SHOP" })).toThrow();
  });

  it("rejects spaces", () => {
    expect(() => requestSenderNameSchema.parse({ name: "MY SHOP" })).toThrow();
  });

  it("accepts exactly 3 chars", () => {
    const result = requestSenderNameSchema.parse({ name: "ABC" });
    expect(result.name).toBe("ABC");
  });

  it("accepts exactly 11 chars", () => {
    const result = requestSenderNameSchema.parse({ name: "ABCDEFGHIJK" });
    expect(result.name).toBe("ABCDEFGHIJK");
  });
});

describe("approveSenderNameSchema", () => {
  const validCuid = "clxxxxxxxxxxxxxxxxxxxxxxxxx".slice(0, 25);

  it("accepts approve action", () => {
    const result = approveSenderNameSchema.parse({ id: validCuid, action: "approve" });
    expect(result.action).toBe("approve");
  });

  it("accepts reject with note", () => {
    const result = approveSenderNameSchema.parse({
      id: validCuid,
      action: "reject",
      rejectNote: "ชื่อไม่เหมาะสม",
    });
    expect(result.rejectNote).toBe("ชื่อไม่เหมาะสม");
  });

  it("rejects invalid action", () => {
    expect(() => approveSenderNameSchema.parse({ id: validCuid, action: "delete" })).toThrow();
  });
});

// ==========================================
// Payment Validations
// ==========================================

describe("purchasePackageSchema", () => {
  const validCuid = "clxxxxxxxxxxxxxxxxxxxxxxxxx".slice(0, 25);

  it("accepts bank_transfer", () => {
    const result = purchasePackageSchema.parse({ packageId: validCuid, method: "bank_transfer" });
    expect(result.method).toBe("bank_transfer");
  });

  it("accepts promptpay", () => {
    const result = purchasePackageSchema.parse({ packageId: validCuid, method: "promptpay" });
    expect(result.method).toBe("promptpay");
  });

  it("rejects invalid method", () => {
    expect(() => purchasePackageSchema.parse({ packageId: validCuid, method: "credit_card" })).toThrow();
  });
});

describe("uploadSlipSchema", () => {
  const validCuid = "clxxxxxxxxxxxxxxxxxxxxxxxxx".slice(0, 25);

  it("accepts valid slip URL", () => {
    const result = uploadSlipSchema.parse({
      transactionId: validCuid,
      slipUrl: "https://example.com/slip.jpg",
    });
    expect(result.slipUrl).toContain("https://");
  });

  it("rejects invalid URL", () => {
    expect(() =>
      uploadSlipSchema.parse({ transactionId: validCuid, slipUrl: "not-url" })
    ).toThrow();
  });
});

// ==========================================
// API Key Validations
// ==========================================

describe("createApiKeySchema", () => {
  it("accepts valid name", () => {
    const result = createApiKeySchema.parse({ name: "Production" });
    expect(result.name).toBe("Production");
  });

  it("rejects empty name", () => {
    expect(() => createApiKeySchema.parse({ name: "" })).toThrow();
  });

  it("trims whitespace", () => {
    const result = createApiKeySchema.parse({ name: "  Staging  " });
    expect(result.name).toBe("Staging");
  });
});

// ==========================================
// Common Validations
// ==========================================

describe("idSchema", () => {
  it("accepts valid cuid", () => {
    const cuid = "clxxxxxxxxxxxxxxxxxxxxxxxxx".slice(0, 25);
    const result = idSchema.parse({ id: cuid });
    expect(result.id).toBeTruthy();
  });

  it("rejects empty string", () => {
    expect(() => idSchema.parse({ id: "" })).toThrow();
  });

  it("rejects random string", () => {
    expect(() => idSchema.parse({ id: "not-a-cuid" })).toThrow();
  });
});

describe("paginationSchema", () => {
  it("defaults to page 1, limit 20", () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("accepts custom page and limit", () => {
    const result = paginationSchema.parse({ page: 3, limit: 50 });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it("rejects page 0", () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
  });

  it("rejects limit > 100", () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });

  it("coerces string to number", () => {
    const result = paginationSchema.parse({ page: "2", limit: "10" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });
});

describe("reportFilterSchema", () => {
  it("defaults page and limit", () => {
    const result = reportFilterSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("accepts status filter", () => {
    const result = reportFilterSchema.parse({ status: "delivered" });
    expect(result.status).toBe("delivered");
  });

  it("rejects invalid status", () => {
    expect(() => reportFilterSchema.parse({ status: "unknown" })).toThrow();
  });

  it("accepts all valid statuses", () => {
    for (const status of ["pending", "sent", "delivered", "failed"]) {
      const result = reportFilterSchema.parse({ status });
      expect(result.status).toBe(status);
    }
  });
});

// ==========================================
// Utility Functions
// ==========================================

describe("calculateSmsCount", () => {
  it("Thai message: 1 SMS for ≤70 chars", () => {
    expect(calculateSmsCount("สวัสดี")).toBe(1);
  });

  it("Thai message: 2 SMS for 71-140 chars", () => {
    const msg = "ก".repeat(71);
    expect(calculateSmsCount(msg)).toBe(2);
  });

  it("Thai message: exactly 70 chars = 1 SMS", () => {
    const msg = "ก".repeat(70);
    expect(calculateSmsCount(msg)).toBe(1);
  });

  it("English message: 1 SMS for ≤160 chars", () => {
    expect(calculateSmsCount("Hello World")).toBe(1);
  });

  it("English message: 2 SMS for 161-320 chars", () => {
    const msg = "A".repeat(161);
    expect(calculateSmsCount(msg)).toBe(2);
  });

  it("English message: exactly 160 chars = 1 SMS", () => {
    const msg = "A".repeat(160);
    expect(calculateSmsCount(msg)).toBe(1);
  });

  it("mixed Thai+English uses Thai limit (70)", () => {
    const msg = "Hello สวัสดี";
    expect(calculateSmsCount(msg)).toBe(1); // 12 chars < 70
  });

  it("empty message = 0 SMS", () => {
    // Math.ceil(0/70) = 0
    expect(calculateSmsCount("")).toBe(0);
  });
});

describe("calculateCreditCost", () => {
  it("equals SMS count", () => {
    expect(calculateCreditCost("Hello")).toBe(1);
    expect(calculateCreditCost("ก".repeat(71))).toBe(2);
  });
});

describe("normalizePhone", () => {
  it("converts 0xx to +66xx", () => {
    expect(normalizePhone("0891234567")).toBe("+66891234567");
  });

  it("handles 66 prefix", () => {
    expect(normalizePhone("66891234567")).toBe("+66891234567");
  });

  it("strips non-digits", () => {
    expect(normalizePhone("089-123-4567")).toBe("+66891234567");
  });
});
