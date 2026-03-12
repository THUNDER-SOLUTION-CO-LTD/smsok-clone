import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(var(--accent-rgb), 0.08)",
          }}
        >
          <Settings
            className="w-8 h-8"
            style={{ color: "var(--accent)" }}
          />
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          ระบบตั้งค่าอยู่ระหว่างการพัฒนา จะเปิดให้ใช้งานเร็ว ๆ นี้
        </p>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent)]">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
