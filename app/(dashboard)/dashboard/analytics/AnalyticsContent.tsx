"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Stats = {
  user: { credits: number; name: string; email: string };
  today: { total: number; delivered: number; failed: number; sent: number; pending: number };
  thisMonth: { total: number; delivered: number; failed: number; sent: number; pending: number };
  recentMessages: { id: string; recipient: string; status: string; senderName: string; creditCost: number; createdAt: Date }[];
};

type Period = "today" | "month";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/* Donut Chart */
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 60;
  const circ = 2 * Math.PI * r;

  const segments = data
    .filter((d) => d.value > 0)
    .reduce<Array<{ label: string; value: number; color: string; pct: number; dashLen: number; dashOffset: number }>>(
      (acc, d) => {
        const used = acc.reduce((sum, seg) => sum + seg.dashLen, 0);
        const pct = d.value / total;
        const dashLen = circ * pct;

        acc.push({
          ...d,
          pct,
          dashLen,
          dashOffset: circ - used,
        });

        return acc;
      },
      []
    );

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(148,163,184,0.06)" strokeWidth="16" />
        {segments.map((seg, i) => (
          <motion.circle
            key={seg.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${seg.dashLen} ${circ - seg.dashLen}`}
            strokeDashoffset={seg.dashOffset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
          />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="24" fontWeight="700" className="rotate-90 origin-center" transform={`rotate(90 ${cx} ${cy})`}>
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="10" fontWeight="500" className="rotate-90 origin-center" transform={`rotate(90 ${cx} ${cy})`}>
          ข้อความ
        </text>
      </svg>
      <div className="flex flex-wrap gap-3 justify-center">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-[var(--text-muted)]">{seg.label}</span>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{Math.round(seg.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Horizontal Bar */
function HBar({ label, value, max, color, textColor }: { label: string; value: number; max: number; color: string; textColor: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
        <span className={`text-xs font-semibold ${textColor}`}>{value.toLocaleString()}</span>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, opacity: 0.85 }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsContent({ stats }: { stats: Stats }) {
  const [period, setPeriod] = useState<Period>("today");

  const data = period === "today" ? stats.today : stats.thisMonth;
  const totalMessages = data.total;
  const successRate = totalMessages > 0 ? Math.round((data.delivered / totalMessages) * 100) : 0;

  const statCards = [
    { label: "ส่งทั้งหมด", value: totalMessages, cardStyle: "bg-[var(--bg-surface)] border border-[rgba(0,255,167,0.12)] rounded-[20px]", color: "text-[#00FFA7]", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#00FFA7]"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg> },
    { label: "สำเร็จ", value: data.delivered, cardStyle: "bg-[var(--bg-surface)] border border-[rgba(0,255,167,0.12)] rounded-[20px]", color: "text-emerald-400", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg> },
    { label: "อัตราสำเร็จ", value: `${successRate}%`, cardStyle: "bg-[var(--bg-surface)] border border-[rgba(0,255,167,0.12)] rounded-[20px]", color: "text-[#00FFA7]", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#00FFA7]"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
    { label: "ล้มเหลว", value: data.failed, cardStyle: "bg-[var(--bg-surface)] border border-[rgba(239,68,68,0.12)] rounded-[20px]", color: "text-red-400", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> },
  ];

  const donutData = [
    { label: "สำเร็จ", value: data.delivered, color: "#10B981" },
    { label: "ส่งแล้ว", value: data.sent, color: "#22D3EE" },
    { label: "รอส่ง", value: data.pending, color: "#F59E0B" },
    { label: "ล้มเหลว", value: data.failed, color: "#EF4444" },
  ];

  return (
    <motion.div className="p-6 md:p-8 max-w-6xl" initial="hidden" animate="show" variants={stagger}>
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">รายงานและสถิติ</h1>
          <p className="text-[var(--text-secondary)] text-sm">วิเคราะห์ประสิทธิภาพการส่ง SMS แบบ real-time</p>
        </div>
        <Link href="/dashboard" className="bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] rounded-xl hover:border-[rgba(0,255,167,0.3)] hover:bg-[rgba(0,255,167,0.04)] px-4 py-2 text-sm font-medium">
          กลับแดชบอร์ด
        </Link>
      </motion.div>

      {/* Period Tabs */}
      <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
        {([
          { key: "today" as Period, label: "วันนี้" },
          { key: "month" as Period, label: "เดือนนี้" },
        ]).map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              period === p.key
                ? "bg-[rgba(0,255,167,0.1)] text-[#00FFA7] border border-[rgba(0,255,167,0.15)]"
                : "bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8" variants={stagger}>
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={fadeUp} whileHover={{ y: -4 }} className={`${stat.cardStyle} card-hover p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[var(--text-muted)]">{stat.label}</span>
              {stat.icon}
            </div>
            <p className={`text-3xl font-bold ${stat.color}`}>
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Two columns: Donut + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Donut Chart */}
        <motion.div variants={fadeUp} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[20px] p-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#00FFA7]">
              <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0110 10" />
            </svg>
            สัดส่วนสถานะ
          </h3>
          {totalMessages > 0 ? (
            <DonutChart data={donutData} />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--text-muted)]">ยังไม่มีข้อมูล</p>
            </div>
          )}
        </motion.div>

        {/* Breakdown Bars */}
        <motion.div variants={fadeUp} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[20px] p-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#00FFA7]">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            รายละเอียด
          </h3>
          <div className="space-y-5">
            <HBar label="สำเร็จ (Delivered)" value={data.delivered} max={totalMessages} color="#10B981" textColor="text-emerald-400" />
            <HBar label="ส่งแล้ว (Sent)" value={data.sent} max={totalMessages} color="#22D3EE" textColor="text-[#00FFA7]" />
            <HBar label="รอดำเนินการ (Pending)" value={data.pending} max={totalMessages} color="#F59E0B" textColor="text-amber-400" />
            <HBar label="ล้มเหลว (Failed)" value={data.failed} max={totalMessages} color="#EF4444" textColor="text-red-400" />
          </div>

          {/* Credit usage */}
          <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">เครดิตคงเหลือ</span>
              <span className="text-lg font-bold text-[var(--accent)]">{stats.user.credits.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[20px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#00FFA7]">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            กิจกรรมล่าสุด
          </h3>
          <Link href="/dashboard/messages" className="text-xs text-[var(--text-muted)] hover:text-[#00FFA7] transition-colors">
            ดูทั้งหมด →
          </Link>

        </div>

        {stats.recentMessages.length > 0 ? (
          <div className="space-y-2">
            {stats.recentMessages.slice(0, 5).map((msg) => {
              const statusMap: Record<string, { dot: string; label: string }> = {
                delivered: { dot: "bg-emerald-400", label: "สำเร็จ" },
                sent: { dot: "bg-[#00FFA7]", label: "ส่งแล้ว" },
                pending: { dot: "bg-amber-400", label: "รอส่ง" },
                failed: { dot: "bg-red-400", label: "ล้มเหลว" },
              };
              const s = statusMap[msg.status] || statusMap.pending;
              return (
                <div key={msg.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-sm font-mono text-[var(--text-secondary)]">{msg.recipient}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">{msg.senderName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">฿{msg.creditCost}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--text-muted)] mb-4">ยังไม่มีข้อความ</p>
            <Link href="/dashboard/send" className="btn-primary px-5 py-2.5 text-sm font-semibold rounded-xl inline-flex items-center gap-2">
              ส่ง SMS แรก
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
