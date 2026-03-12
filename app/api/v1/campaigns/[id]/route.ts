import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";
import { requireApiPermission } from "@/lib/rbac";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/v1/campaigns/:id — campaign detail
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "campaign");
    if (denied) return denied;

    const { id } = await ctx.params;
    const campaign = await db.campaign.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        recipientSource: true,
        contactGroupId: true,
        templateId: true,
        senderName: true,
        messageBody: true,
        scheduledAt: true,
        totalRecipients: true,
        validRecipients: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
        creditReserved: true,
        creditUsed: true,
        startedAt: true,
        completedAt: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
        contactGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!campaign) throw new ApiError(404, "ไม่พบแคมเปญ");

    return apiResponse({ campaign });
  } catch (error) {
    return apiError(error);
  }
}
