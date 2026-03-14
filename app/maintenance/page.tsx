import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-base)]">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(var(--warning-rgb,245,158,11),0.08)", border: "1px solid rgba(var(--warning-rgb,245,158,11),0.15)" }}
        >
          <Wrench size={32} style={{ color: "var(--warning)" }} />
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          ระบบกำลังปรับปรุง
        </h1>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          เรากำลังปรับปรุงระบบเพื่อประสบการณ์ที่ดีขึ้น
        </p>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          กรุณากลับมาใหม่ในอีกสักครู่
        </p>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px]"
          style={{
            background: "rgba(var(--warning-rgb,245,158,11),0.06)",
            border: "1px solid rgba(var(--warning-rgb,245,158,11),0.12)",
            color: "var(--warning)",
          }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--warning)" }} />
          กำลังดำเนินการ
        </div>

        <div className="mt-12 mx-auto h-px w-24" style={{ background: "var(--border-default)" }} />
        <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          SMSOK — support@smsok.com
        </p>
      </div>
    </div>
  );
}
