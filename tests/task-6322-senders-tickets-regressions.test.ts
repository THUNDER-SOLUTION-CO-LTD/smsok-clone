import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  packagePurchaseFindMany: vi.fn(),
  packageTierFindMany: vi.fn(),
  senderNameFindMany: vi.fn(),
  messageGroupBy: vi.fn(),
  queryRaw: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => {
  class TestApiError extends Error {
    status: number;
    code?: string;

    constructor(status: number, message: string, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  return {
    ApiError: TestApiError,
    apiResponse: (data: unknown, status = 200) => Response.json(data, { status }),
    apiError: (error: unknown) => {
      const status =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
          ? error.status
          : 500;

      return Response.json(
        { error: error instanceof Error ? error.message : "Internal Server Error" },
        { status },
      );
    },
    authenticateRequest: mocks.authenticateRequest,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    packagePurchase: {
      findMany: mocks.packagePurchaseFindMany,
    },
    packageTier: {
      findMany: mocks.packageTierFindMany,
    },
    senderName: {
      findMany: mocks.senderNameFindMany,
    },
    message: {
      groupBy: mocks.messageGroupBy,
    },
    $queryRaw: mocks.queryRaw,
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mocks.loggerWarn,
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/sender-name-validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sender-name-validation")>();
  return {
    ...actual,
    validateSenderName: vi.fn(),
  };
});

vi.mock("@/lib/tickets/rate-limit", () => ({
  enforceSupportTicketRateLimit: vi.fn(),
}));

import { getRemainingQuota } from "@/lib/package/quota";
import { GET as getSenders } from "@/app/api/v1/senders/route";
import { GET as getTickets } from "@/app/api/v1/tickets/route";

describe("Task #6322: senders + tickets API regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.authenticateRequest.mockResolvedValue({ id: "user_6322", role: "user" });
    mocks.packagePurchaseFindMany.mockResolvedValue([]);
    mocks.packageTierFindMany.mockResolvedValue([]);
    mocks.senderNameFindMany.mockResolvedValue([]);
    mocks.messageGroupBy.mockResolvedValue([]);
    mocks.queryRaw.mockResolvedValue([]);
  });

  it("returns zero quota instead of crashing when a user has no active packages", async () => {
    const quota = await getRemainingQuota("user_6322");

    expect(quota).toEqual({
      packages: [],
      totalSms: 0,
      totalUsed: 0,
      totalRemaining: 0,
      senderNameLimit: 0,
    });
    expect(mocks.packageTierFindMany).not.toHaveBeenCalled();
  });

  it("keeps GET /api/v1/senders healthy for users without an active package", async () => {
    mocks.senderNameFindMany.mockResolvedValue([
      {
        id: "sender_1",
        name: "ALPHA",
        status: "PENDING",
        senderType: "general",
        adminNotes: null,
        rejectNote: null,
        createdAt: new Date("2026-03-17T00:00:00.000Z"),
        approvedAt: null,
      },
    ]);

    const response = await getSenders(
      new NextRequest("http://localhost/api/v1/senders"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.quota).toEqual({
      used: 1,
      limit: 0,
      packageName: null,
    });
    expect(body.senders[0]).toMatchObject({
      id: "sender_1",
      name: "ALPHA",
      type: "general",
      status: "PENDING",
      smsSent: 0,
    });
  });

  it("keeps GET /api/v1/tickets healthy even when reply-count enrichment fails", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([
        {
          id: "ticket_1",
          subject: "Need help",
          description: "Ticket listing should not 500",
          status: "open",
          priority: "low",
          category: "general",
          createdAt: new Date("2026-03-17T00:00:00.000Z"),
          updatedAt: new Date("2026-03-17T01:00:00.000Z"),
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }])
      .mockRejectedValueOnce(new Error("ticket_replies relation unavailable"));

    const response = await getTickets(
      new NextRequest("http://localhost/api/v1/tickets?page=1&limit=20"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
    expect(body.tickets).toHaveLength(1);
    expect(body.tickets[0]).toMatchObject({
      id: "ticket_1",
      subject: "Need help",
      status: "OPEN",
      priority: "LOW",
      category: "GENERAL",
      _count: { replies: 0 },
    });
    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      "Support ticket reply counts unavailable",
      expect.objectContaining({
        ticketCount: 1,
        error: "ticket_replies relation unavailable",
      }),
    );
  });

  it("uses raw SQL plus enum normalization for ticket list compatibility", () => {
    const routeSource = readFileSync(
      resolve(ROOT, "app/api/v1/tickets/route.ts"),
      "utf8",
    );

    expect(routeSource).toContain("db.$queryRaw<TicketListRow[]>");
    expect(routeSource).toContain("st.category::text AS category");
    expect(routeSource).toContain("normalizeTicketCategory(ticket.category)");
    expect(routeSource).toContain("_count: { replies: replyCounts.get(ticket.id) ?? 0 }");
  });
});
