import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "./api-auth";
import {
  ADMIN_SESSION_COOKIE_NAME,
  authenticateAdminToken,
} from "./admin-auth";

const ADMIN_PAGE_ROLE_RULES: Array<{
  prefix: string;
  allowedRoles: string[];
}> = [
  { prefix: "/admin/operations", allowedRoles: ["OPERATIONS"] },
  { prefix: "/admin/finance", allowedRoles: ["FINANCE"] },
  { prefix: "/admin/support", allowedRoles: ["SUPPORT"] },
  { prefix: "/admin/ceo", allowedRoles: [] },
  { prefix: "/admin/cto", allowedRoles: ["DEV"] },
  { prefix: "/admin/marketing", allowedRoles: ["MARKETING"] },
];

function getPageRoles(pathname: string) {
  return ADMIN_PAGE_ROLE_RULES.find((rule) =>
    pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  )?.allowedRoles;
}

export async function requireAdminPageAccess(pathname: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect(`/login?from=${encodeURIComponent(pathname)}`);
  }

  try {
    return await authenticateAdminToken(token, getPageRoles(pathname));
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      redirect("/admin");
    }

    redirect(`/login?from=${encodeURIComponent(pathname)}`);
  }
}
