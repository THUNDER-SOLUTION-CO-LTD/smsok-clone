import { getSession } from "./auth";

export async function resolveActionUserId(explicitUserId?: string | null) {
  const sessionUser = await getSession();

  if (sessionUser?.id) {
    if (explicitUserId && explicitUserId !== sessionUser.id) {
      throw new Error("ไม่สามารถดำเนินการแทนผู้ใช้อื่นได้");
    }

    return sessionUser.id;
  }

  if (explicitUserId) {
    return explicitUserId;
  }

  throw new Error("กรุณาเข้าสู่ระบบ");
}
