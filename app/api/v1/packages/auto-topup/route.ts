import { ApiError, apiError } from "@/lib/api-auth";

const DEPRECATION_MESSAGE = "การซื้อแพ็กเกจอัตโนมัติถูกยกเลิกแล้ว ใช้การซื้อแพ็กเกจและแนบสลิปตามขั้นตอนใหม่แทน";

// GET /api/v1/packages/auto-topup — deprecated in package-purchase model
export async function GET() {
  return apiError(new ApiError(410, DEPRECATION_MESSAGE));
}

// POST /api/v1/packages/auto-topup — deprecated in package-purchase model
export async function POST() {
  return apiError(new ApiError(410, DEPRECATION_MESSAGE));
}
