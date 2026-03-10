import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { updateGroup, deleteGroup } from "@/lib/actions/groups";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiKey(req);
    const { id } = await params;
    const body = await req.json();
    const group = await updateGroup(user.id, id, body);
    return apiResponse(group);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiKey(req);
    const { id } = await params;
    await deleteGroup(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
