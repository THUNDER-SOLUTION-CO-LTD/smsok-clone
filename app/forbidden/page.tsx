import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-base)]">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(var(--error-rgb,239,68,68),0.08)", border: "1px solid rgba(var(--error-rgb,239,68,68),0.15)" }}
        >
          <ShieldAlert size={32} style={{ color: "var(--error)" }} />
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          ไม่มีสิทธิ์เข้าถึง
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg px-6 h-11 text-sm font-medium transition-colors bg-[var(--accent)] text-[var(--text-on-accent)]"
          >
            ไปที่ Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg px-6 h-11 text-sm font-medium transition-colors bg-transparent text-[var(--text-secondary)] border border-[var(--border-default)]"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
