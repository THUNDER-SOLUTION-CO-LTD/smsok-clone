import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateRequestUser } from "@/lib/request-auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequestUser(req);
    await prisma.user.update({
      where: { id: user.id },
      data: { notificationsReadAt: new Date() },
    });
    return apiResponse({ success: true });
  } catch (e) {
    return apiError(e);
  }
}
