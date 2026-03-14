"use client";

import { useRouter } from "next/navigation";
import { Clock, LogIn } from "lucide-react";
import { StateDisplay } from "@/components/ui/state-display";

export default function SessionExpiredPage() {
  const router = useRouter();

  return (
    <div className="bg-[var(--bg-base)]">
      <StateDisplay
        icon={Clock}
        iconColor="#FACD63"
        iconBg="rgba(250,205,99,0.08)"
        title="Session หมดอายุ"
        description="เพื่อความปลอดภัย กรุณาเข้าสู่ระบบอีกครั้ง"
        primaryAction={{
          label: "เข้าสู่ระบบ",
          icon: LogIn,
          href: "/login",
        }}
        countdown={{
          seconds: 5,
          label: "กำลังพาไปหน้าเข้าสู่ระบบใน {n} วินาที...",
          onComplete: () => router.push("/login"),
        }}
        size="lg"
      />
    </div>
  );
}
