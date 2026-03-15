"use client";

import { ShieldAlert, ArrowLeft } from "lucide-react";
import { StateDisplay } from "@/components/ui/state-display";

export default function ForbiddenPage() {
  return (
    <div className="bg-[var(--bg-base)]">
      <StateDisplay
        icon={ShieldAlert}
        iconColor="#F23645"
        iconBg="rgba(242,54,69,0.08)"
        title="ไม่มีสิทธิ์เข้าถึง"
        description="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ"
        primaryAction={{
          label: "กลับหน้าหลัก",
          icon: ArrowLeft,
          href: "/dashboard",
          variant: "outline",
        }}
        secondaryAction={{
          label: "ติดต่อผู้ดูแลระบบ",
          href: "mailto:admin@company.com",
        }}
        size="lg"
      />
    </div>
  );
}
