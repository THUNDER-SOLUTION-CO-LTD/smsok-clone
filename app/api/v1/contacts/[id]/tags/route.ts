import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { authenticatePublicApiKey } from "@/lib/api-key-auth";
import { assignTagToContact, unassignTagFromContact } from "@/lib/actions/tags";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticatePublicApiKey(req);
    const body = await req.json();
    const { id } = await params;
    const result = await assignTagToContact(user.id, id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticatePublicApiKey(req);
    const body = await req.json();
    const { id } = await params;
    const result = await unassignTagFromContact(user.id, id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
