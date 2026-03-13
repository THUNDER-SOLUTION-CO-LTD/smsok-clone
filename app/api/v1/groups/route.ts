import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "group");
    if (denied) return denied;

    const groups = await prisma.contactGroup.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        createdAt: group.createdAt,
        memberCount: group._count.members,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
