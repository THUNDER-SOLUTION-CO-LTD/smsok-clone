"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { StateDisplay } from "@/components/ui/state-display";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error.digest || error.message);
  }, [error]);

  return (
    <div className="bg-[var(--bg-base)]">
      <StateDisplay
        icon={AlertTriangle}
        iconColor="#F23645"
        iconBg="rgba(242,54,69,0.08)"
        errorCode="500"
        title="เกิดข้อผิดพลาด"
        description="เซิร์ฟเวอร์มีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้ง"
        primaryAction={{
          label: "ลองใหม่",
          icon: RefreshCw,
          onClick: reset,
        }}
        secondaryAction={{
          label: "ติดต่อฝ่ายสนับสนุน",
          href: "mailto:support@smsok.com",
        }}
        size="lg"
      />
      {error.digest && (
        <div className="fixed bottom-8 left-0 right-0 text-center">
          <span className="text-[11px] text-[var(--text-muted)]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            Error ID: {error.digest}
          </span>
        </div>
      )}
    </div>
  );
}
