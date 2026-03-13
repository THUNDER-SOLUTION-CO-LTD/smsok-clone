import { NextRequest } from "next/server";
import { apiError, apiResponse, authenticateRequest } from "@/lib/api-auth";
import { deleteTag, updateTag } from "@/lib/actions/tags";
import { updateTagSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const input = updateTagSchema.parse(body);
    const { id } = await params;
    const tag = await updateTag(user.id, id, input);
    return apiResponse(tag);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;
    await deleteTag(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
