import { ApiError, apiError, apiResponse } from "@/lib/api-auth"
import { getSession } from "@/lib/auth"
import { getDefaultOrgMember2FAStatuses } from "@/lib/actions/two-factor"

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ")

    return apiResponse(await getDefaultOrgMember2FAStatuses(session.id))
  } catch (error) {
    return apiError(error)
  }
}
