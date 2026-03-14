import { headers } from "next/headers";
import type { ReactNode } from "react";
import AdminShell from "./AdminShell";
import { requireAdminPageAccess } from "@/lib/admin-page-auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/admin";

  await requireAdminPageAccess(pathname);
  return <AdminShell>{children}</AdminShell>;
}
