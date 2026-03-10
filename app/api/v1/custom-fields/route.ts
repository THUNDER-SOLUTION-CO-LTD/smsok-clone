import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { getCustomFields, createCustomField } from "@/lib/actions/custom-fields";

// GET /api/v1/custom-fields — list all custom fields
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const fields = await getCustomFields(user.id);
    return apiResponse({ fields });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/custom-fields — create custom field
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new Error("กรุณาส่งข้อมูล JSON");
    }
    const { name, type, options, required } = body as Record<string, unknown>;
    if (!name || typeof name !== "string") throw new Error("กรุณาระบุชื่อฟิลด์");
    if (!type || typeof type !== "string") throw new Error("กรุณาระบุประเภทฟิลด์");

    const field = await createCustomField(user.id, {
      name,
      type,
      options: Array.isArray(options) ? options.filter((o): o is string => typeof o === "string") : undefined,
      required: typeof required === "boolean" ? required : undefined,
    });
    return apiResponse(field, 201);
  } catch (error) {
    return apiError(error);
  }
}
