import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const schema = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");

describe("Prisma Schema: Models", () => {
  it("has User model", () => {
    expect(schema).toContain("model User");
  });

  it("has Message model", () => {
    expect(schema).toContain("model Message");
  });

  it("has ApiKey model", () => {
    expect(schema).toContain("model ApiKey");
  });

  it("has Contact model", () => {
    expect(schema).toContain("model Contact");
  });

  it("has ContactGroup model", () => {
    expect(schema).toContain("model ContactGroup");
  });

  it("has ContactGroupMember model", () => {
    expect(schema).toContain("model ContactGroupMember");
  });

  it("has SenderName model", () => {
    expect(schema).toContain("model SenderName");
  });

  it("has Package model", () => {
    expect(schema).toContain("model Package");
  });

  it("has Transaction model", () => {
    expect(schema).toContain("model Transaction");
  });
});

describe("Prisma Schema: User defaults", () => {
  it("credits default 500", () => {
    expect(schema).toContain("@default(500)");
  });

  it("role default user", () => {
    expect(schema).toContain('@default("user")');
  });

  it("emailVerified default false", () => {
    expect(schema).toContain("@default(false)");
  });

  it("email is unique", () => {
    expect(schema).toContain("email         String    @unique");
  });
});

describe("Prisma Schema: Message", () => {
  it("status default pending", () => {
    expect(schema).toContain('@default("pending")');
  });

  it("creditCost default 1", () => {
    expect(schema).toContain("@default(1)");
  });

  it("has userId + createdAt index", () => {
    expect(schema).toContain("@@index([userId, createdAt])");
  });

  it("has status index", () => {
    expect(schema).toContain("@@index([status])");
  });
});

describe("Prisma Schema: ApiKey", () => {
  it("key is unique", () => {
    expect(schema).toContain("key       String    @unique");
  });

  it("isActive default true", () => {
    expect(schema).toContain("@default(true)");
  });

  it("has key index", () => {
    expect(schema).toContain("@@index([key])");
  });
});

describe("Prisma Schema: Contact", () => {
  it("has unique userId+phone constraint", () => {
    expect(schema).toContain("@@unique([userId, phone])");
  });

  it("has userId index", () => {
    expect(schema).toContain("@@index([userId])");
  });
});

describe("Prisma Schema: ContactGroupMember", () => {
  it("has unique groupId+contactId", () => {
    expect(schema).toContain("@@unique([groupId, contactId])");
  });

  it("cascade deletes on group", () => {
    expect(schema).toContain("onDelete: Cascade");
  });
});

describe("Prisma Schema: SenderName", () => {
  it("has unique userId+name", () => {
    expect(schema).toContain("@@unique([userId, name])");
  });

  it("status default pending", () => {
    // Multiple @default("pending") in schema — just ensure it exists
    const senderBlock = schema.slice(
      schema.indexOf("model SenderName"),
      schema.indexOf("model Package")
    );
    expect(senderBlock).toContain('@default("pending")');
  });
});

describe("Prisma Schema: Package", () => {
  it("has isActive flag", () => {
    expect(schema).toContain("isActive");
  });

  it("has isBestSeller flag", () => {
    expect(schema).toContain("isBestSeller");
  });

  it("has maxSenders default 5", () => {
    expect(schema).toContain("@default(5)");
  });
});

describe("Prisma Schema: Transaction", () => {
  it("has userId+createdAt index", () => {
    const txBlock = schema.slice(schema.indexOf("model Transaction"));
    expect(txBlock).toContain("@@index([userId, createdAt])");
  });

  it("has status index", () => {
    const txBlock = schema.slice(schema.indexOf("model Transaction"));
    expect(txBlock).toContain("@@index([status])");
  });

  it("has expiresAt field", () => {
    expect(schema).toContain("expiresAt");
  });
});
