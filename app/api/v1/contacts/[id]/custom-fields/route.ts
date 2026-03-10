import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getCustomFieldValues, setCustomFieldValues } from "@/lib/actions/custom-fields";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/v1/contacts/:id/custom-fields — get custom field values for contact
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateApiKey(req);
    const { id: contactId } = await ctx.params;
    const values = await getCustomFieldValues(user.id, contactId);
    return apiResponse({ values });
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/contacts/:id/custom-fields — set custom field values for contact
export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    const user = await authenticateApiKey(req);
    const { id: contactId } = await ctx.params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("กรุณาส่งข้อมูล JSON");
    }
    const { values } = body as { values?: unknown };
    if (!Array.isArray(values)) throw new Error("กรุณาส่ง values เป็น array");

    const parsed = values.map((v: unknown) => {
      const item = v as Record<string, unknown>;
      if (typeof item.fieldId !== "string" || typeof item.value !== "string") {
        throw new Error("แต่ละ value ต้องมี fieldId และ value เป็น string");
      }
      return { fieldId: item.fieldId, value: item.value };
    });

    await setCustomFieldValues(user.id, contactId, parsed);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
