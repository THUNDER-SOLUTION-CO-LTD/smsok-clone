import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getContactsNotInGroup } from "@/lib/actions/groups";

// GET /api/v1/groups/:id/available-contacts?search=xxx
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiKey(req);
    const { id: groupId } = await params;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;

    const contacts = await getContactsNotInGroup(user.id, groupId, search);
    return apiResponse({ contacts });
  } catch (error) {
    return apiError(error);
  }
}
