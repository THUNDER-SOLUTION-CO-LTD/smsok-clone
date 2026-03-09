import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { updateTemplate, deleteTemplate } from "@/lib/actions/templates";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateApiKey(req);
    const { id } = await params;
    const body = await req.json();
    const template = await updateTemplate(user.id, id, body);
    return apiResponse(template);
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
    await deleteTemplate(user.id, id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
