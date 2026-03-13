import { NextRequest } from "next/server"
import { ApiError, apiError, apiResponse } from "@/lib/api-auth"
import { getSession } from "@/lib/auth"
import {
  getDefaultOrgSecurityPolicy,
  updateDefaultOrgSecurityPolicy,
} from "@/lib/actions/two-factor"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ")

    return apiResponse(await getDefaultOrgSecurityPolicy(session.id))
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ")

    let body: unknown
    try {
      body = await req.json()
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON")
    }

    const payload = body as Record<string, unknown>
    const require2FA = payload.require2FA ?? payload.require2fa
    if (typeof require2FA !== "boolean") {
      throw new ApiError(400, "กรุณาระบุ require2FA เป็น true หรือ false")
    }

    return apiResponse(await updateDefaultOrgSecurityPolicy(session.id, require2FA))
  } catch (error) {
    return apiError(error)
  }
}
