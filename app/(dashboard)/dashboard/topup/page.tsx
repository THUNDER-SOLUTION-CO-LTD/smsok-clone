import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPackages } from "@/lib/actions/payments";
import { PACKAGES } from "@/lib/packages-data";
import TopupContent from "./TopupContent";
import DashboardShell from "../DashboardShell";

export default async function TopupPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  let packages;
  try {
    const dbPackages = await getPackages();
    packages = dbPackages.length > 0
      ? dbPackages
      : PACKAGES.map((p, i) => ({
          ...p,
          id: `fallback-${i}`,
          isActive: true,
          isBestSeller: i === 1,
          createdAt: new Date(),
        }));
  } catch {
    packages = PACKAGES.map((p, i) => ({
      ...p,
      id: `fallback-${i}`,
      isActive: true,
      isBestSeller: i === 1,
      createdAt: new Date(),
    }));
  }

  return (
    <DashboardShell user={user} title="เติมเงิน">
      <TopupContent user={user} packages={packages} />
    </DashboardShell>
  );
}
