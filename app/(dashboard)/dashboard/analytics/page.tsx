import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AnalyticsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const stats = [
    {
      label: "ส่งทั้งหมด",
      value: "0",
      glassClass: "glass-cyan",
      iconColor: "text-[var(--accent)]",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
      ),
    },
    {
      label: "ส่งสำเร็จ",
      value: "0",
      glassClass: "glass-emerald",
      iconColor: "text-[var(--success)]",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "อัตราสำเร็จ",
      value: "0%",
      glassClass: "glass-violet",
      iconColor: "text-[var(--accent-secondary)]",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      label: "ค่าใช้จ่าย",
      value: "฿0",
      glassClass: "glass-rose",
      iconColor: "text-[var(--accent-pink)]",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold gradient-text-mixed mb-2">
            รายงานและสถิติ
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            วิเคราะห์ประสิทธิภาพการส่ง SMS
          </p>
        </div>
        <Link
          href="/dashboard"
          className="btn-glass px-4 py-2 text-sm font-medium"
        >
          กลับแดชบอร์ด
        </Link>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2 mb-6">
        <button type="button" className="btn-primary px-4 py-2 text-sm font-medium">
          วันนี้
        </button>
        <button type="button" className="btn-glass px-4 py-2 text-sm font-medium">
          7 วัน
        </button>
        <button type="button" className="btn-glass px-4 py-2 text-sm font-medium">
          30 วัน
        </button>
        <button type="button" className="btn-glass px-4 py-2 text-sm font-medium">
          90 วัน
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 stagger-children">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.glassClass} p-6 card-hover`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {stat.label}
              </span>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="glass p-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          กราฟสถิติการส่ง
        </h2>
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--border-subtle)] rounded-xl">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">
            กราฟจะแสดงเมื่อมีข้อมูลการส่ง
          </p>
          <p className="text-[var(--text-muted)] text-xs">
            เริ่มส่ง SMS เพื่อดูสถิติของคุณ
          </p>
        </div>
      </div>
    </div>
  );
}
