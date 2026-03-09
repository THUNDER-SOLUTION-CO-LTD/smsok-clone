"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { sendSms } from "@/lib/actions/sms";

type User = {
  id: string;
  name: string;
  email: string;
  credits: number;
  role: string;
};

type DashboardStats = {
  user: { credits: number; name: string; email: string };
  today: { total: number; delivered: number; failed: number; sent: number; pending: number };
  thisMonth: { total: number; delivered: number; failed: number; sent: number; pending: number };
  recentMessages: { id: string; recipient: string; status: string; senderName: string; creditCost: number; createdAt: Date }[];
};

/* ── Animated Counter ── */
function AnimatedCounter({ value, duration = 1.2 }: { value: string; duration?: number }) {
  const numericValue = Number.parseInt(value.replace(/,/g, ""), 10);
  const isNumeric = !Number.isNaN(numericValue);
  const [display, setDisplay] = useState(isNumeric ? "0" : value);

  useEffect(() => {
    if (!isNumeric) return;
    const end = numericValue;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.floor(eased * end).toLocaleString());
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplay(end.toLocaleString());
    };
    requestAnimationFrame(animate);
  }, [numericValue, duration, value, isNumeric]);

  return <>{display}</>;
}

/* ── Sparkline Bar Chart ── */
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {data.map((v, i) => (
        <motion.div
          key={i}
          className="w-[5px] rounded-sm"
          initial={{ height: 2, opacity: 0 }}
          animate={{ height: Math.max((v / max) * 32, 3), opacity: 0.4 + (v / max) * 0.6 }}
          transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

/* ── SVG Area Chart — 7-day SMS ── */
const chartData7d = [
  { day: "จ", value: 120 },
  { day: "อ", value: 180 },
  { day: "พ", value: 150 },
  { day: "พฤ", value: 220 },
  { day: "ศ", value: 310 },
  { day: "ส", value: 190 },
  { day: "อา", value: 140 },
];

function AreaChart() {
  const max = Math.max(...chartData7d.map((d) => d.value));
  const w = 560;
  const h = 180;
  const px = 40;
  const py = 20;
  const gw = w - px * 2;
  const gh = h - py * 2;

  const points = chartData7d.map((d, i) => ({
    x: px + (i / (chartData7d.length - 1)) * gw,
    y: py + gh - (d.value / max) * gh,
  }));

  const linePath = points.map((p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  }).join(" ");

  const areaPath = `${linePath} L${points[points.length - 1].x},${h - py} L${points[0].x},${h - py} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={px} y1={py + gh * (1 - t)} x2={w - px} y2={py + gh * (1 - t)} stroke="rgba(148,163,184,0.06)" strokeWidth="1" />
      ))}
      {/* Area fill */}
      <motion.path d={areaPath} fill="url(#areaGrad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }} />
      {/* Line */}
      <motion.path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <motion.circle cx={p.x} cy={p.y} r="4" fill="#8B5CF6" stroke="#0B1120" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300 }} />
          <text x={p.x} y={h - 4} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="10" fontFamily="Inter, sans-serif">{chartData7d[i].day}</text>
          <motion.text x={p.x} y={p.y - 12} textAnchor="middle" fill="rgba(226,232,240,0.7)" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}>{chartData7d[i].value}</motion.text>
        </g>
      ))}
    </svg>
  );
}

/* ── Activity Ring ── */
function ActivityRing({ percent, color, size = 56 }: { percent: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-white/[0.04]" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

/* ── Stat Card Config ── */
const statCards = [
  {
    label: "เครดิตคงเหลือ", key: "credits" as const, delta: "+1,000", positive: true,
    sparkline: [2, 4, 3, 6, 8, 6, 4, 5, 7, 9], glass: "glass-cyan", color: "#22D3EE",
    glowFrom: "from-cyan-500/20", glowTo: "to-cyan-500/5",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: "ส่งวันนี้", key: "sent" as const, delta: "+23.5%", positive: true,
    sparkline: [1, 3, 5, 4, 7, 5, 3, 4, 6, 8], glass: "glass-violet", color: "#8B5CF6",
    glowFrom: "from-violet-500/20", glowTo: "to-violet-500/5",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "สำเร็จ", key: "delivered" as const, delta: "98.2%", positive: true,
    sparkline: [6, 8, 8, 9, 8, 9, 9, 9, 8, 9], glass: "glass-emerald", color: "#10B981",
    glowFrom: "from-emerald-500/20", glowTo: "to-emerald-500/5",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    label: "ล้มเหลว", key: "failed" as const, delta: "1.8%", positive: false,
    sparkline: [1, 1, 0, 1, 0, 0, 1, 0, 0, 1], glass: "glass-rose", color: "#EF4444",
    glowFrom: "from-red-500/20", glowTo: "to-red-500/5",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
];

/* ── Quick Action Buttons ── */
const quickActions = [
  {
    label: "ส่ง SMS", href: "/dashboard/send",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
    gradient: "from-violet-500 to-purple-600", shadow: "shadow-violet-500/25",
  },
  {
    label: "เติมเครดิต", href: "/dashboard/topup",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
    gradient: "from-cyan-500 to-teal-600", shadow: "shadow-cyan-500/25",
  },
  {
    label: "ดูรายงาน", href: "/dashboard/analytics",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    gradient: "from-pink-500 to-rose-600", shadow: "shadow-pink-500/25",
  },
  {
    label: "API Docs", href: "/dashboard/api-docs",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>,
    gradient: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/25",
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const statusConfig: Record<string, { dot: string; badge: string; label: string }> = {
  delivered: { dot: "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "สำเร็จ" },
  sent: { dot: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", label: "ส่งแล้ว" },
  pending: { dot: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "รอส่ง" },
  failed: { dot: "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]", badge: "bg-red-500/10 text-red-400 border-red-500/20", label: "ล้มเหลว" },
};

export default function DashboardContent({ user, stats, senderNames = ["EasySlip"] }: { user: User; stats?: DashboardStats; senderNames?: string[] }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState(senderNames[0] || "EasySlip");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const handleQuickSend = async () => {
    if (!phone || !message) return;
    setSending(true);
    setSendResult(null);
    try {
      await sendSms(user.id, { senderName, recipient: phone, message });
      setSendResult("ส่งสำเร็จ!");
      setPhone("");
      setMessage("");
    } catch (e) {
      setSendResult(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSending(false);
    }
  };

  const statValues = {
    credits: (stats?.user.credits ?? user.credits).toLocaleString(),
    sent: (stats?.today.total ?? 0).toLocaleString(),
    delivered: (stats?.today.delivered ?? 0).toLocaleString(),
    failed: (stats?.today.failed ?? 0).toLocaleString(),
  };

  const successRate = stats?.today.total
    ? Math.round((stats.today.delivered / stats.today.total) * 100)
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";

  return (
    <motion.div className="p-6 md:p-8 max-w-[1200px]" initial="hidden" animate="show" variants={stagger}>

      {/* ═══ Welcome Hero Banner ═══ */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl mb-8 border border-white/[0.06]">
        {/* Animated gradient border glow */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/25 via-cyan-600/10 to-pink-600/20" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-500/15 blur-[80px] animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full bg-cyan-500/15 blur-[80px] animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-pink-500/10 blur-[60px]" />
        <div className="absolute inset-0 bg-[var(--bg-base)]/50 backdrop-blur-sm" />

        <div className="relative px-6 py-8 md:px-8 md:py-10 flex items-center justify-between">
          <div className="flex-1">
            <motion.p
              className="text-xs text-cyan-300/60 font-medium uppercase tracking-widest mb-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {greeting}
            </motion.p>
            <motion.h2
              className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="gradient-text-mixed">{user.name}</span>
            </motion.h2>
            <motion.div
              className="flex flex-wrap items-center gap-3 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-[var(--text-muted)]">
                วันนี้ส่ง <span className="text-violet-400 font-semibold">{stats?.today.total ?? 0}</span> ข้อความ
              </span>
              {successRate > 0 && (
                <span className="text-[var(--text-muted)]">
                  · สำเร็จ <span className="text-emerald-400 font-semibold">{successRate}%</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                <span className="text-cyan-400 font-semibold">{(stats?.user.credits ?? user.credits).toLocaleString()}</span>
                <span className="text-cyan-400/50">เครดิต</span>
              </span>
            </motion.div>
          </div>

          {/* Activity Ring */}
          <motion.div
            className="hidden md:flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <ActivityRing percent={successRate || 0} color="#10B981" size={72} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-400">{successRate}%</span>
              </div>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">สำเร็จ</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══ Quick Action Buttons ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickActions.map((action, i) => (
          <motion.div key={action.label} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              href={action.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r ${action.gradient} shadow-lg ${action.shadow} text-white text-sm font-medium transition-all hover:shadow-xl`}
            >
              <span className="opacity-90">{action.icon}</span>
              {action.label}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ Stats Grid — Premium glow cards ═══ */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8" variants={stagger}>
        {statCards.map((stat) => (
          <motion.div
            key={stat.key}
            variants={fadeUp}
            whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            className={`${stat.glass} card-conic card-hover p-5 group relative overflow-hidden ${stat.key === "credits" ? "glow-cyan" : stat.key === "sent" ? "glow-violet" : stat.key === "delivered" ? "glow-emerald" : "glow-rose"}`}
          >
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.glowFrom} ${stat.glowTo} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[inherit]`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:border-white/10 transition-colors">
                  {stat.icon}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {stat.delta}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1 text-[var(--text-primary)]">
                <AnimatedCounter value={statValues[stat.key]} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
                <MiniChart data={stat.sparkline} color={stat.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══ Two-column: Quick Send + Recent Messages ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick Send — 2 cols */}
        <motion.div className="lg:col-span-2 glass p-6" variants={fadeUp}>
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-500/10 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <span className="gradient-text-mixed">ส่งด่วน</span>
          </h3>

          <div className="space-y-3">
            <div className="input-float-group">
              <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">ชื่อผู้ส่ง</label>
              <div className="relative">
                <select
                  className="input-glass cursor-pointer appearance-none pr-10"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                >
                  {senderNames.map((name) => (
                    <option key={name} value={name} className="bg-[var(--bg-elevated)] text-white">
                      {name === "EasySlip" ? "EasySlip (ค่าเริ่มต้น)" : name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
            </div>
            <div className="input-float-group">
              <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">เบอร์ปลายทาง</label>
              <input type="text" className="input-glass" placeholder="0891234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="input-float-group">
              <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">ข้อความ</label>
              <textarea className="input-glass resize-none" rows={3} placeholder="รหัส OTP ของคุณคือ {code}" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>

          <AnimatePresence>
            {sendResult && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mt-3 text-xs font-medium ${sendResult.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}
              >
                {sendResult}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleQuickSend}
            disabled={sending || !phone || !message}
            className="btn-gradient w-full mt-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                กำลังส่ง...
              </span>
            ) : (
              <>
                ส่ง SMS
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Recent Messages — 3 cols */}
        <motion.div className="lg:col-span-3 glass p-6" variants={fadeUp}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/15 to-violet-500/10 border border-cyan-500/10 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <span className="gradient-text-cyan">ข้อความล่าสุด</span>
            </h3>
            <motion.div whileHover={{ x: 3 }}>
              <Link href="/dashboard/messages" className="text-xs text-[var(--text-muted)] hover:text-violet-400 transition-colors flex items-center gap-1">
                ดูทั้งหมด
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </motion.div>
          </div>

          {stats?.recentMessages && stats.recentMessages.length > 0 ? (
            <div className="space-y-2">
              {stats.recentMessages.map((msg, i) => {
                const s = statusConfig[msg.status] || statusConfig.pending;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, ease: "easeOut" }}
                    whileHover={{ x: 4, backgroundColor: "rgba(139,92,246,0.04)" }}
                    className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)] hover:border-violet-500/15 transition-all cursor-default group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 dot-pulse ${s.dot}`} />
                      <div>
                        <span className="text-sm text-[var(--text-secondary)] font-mono group-hover:text-[var(--text-primary)] transition-colors">{msg.recipient}</span>
                        <span className="text-[11px] text-[var(--text-muted)] ml-2">{msg.senderName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">฿{msg.creditCost}</span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-[var(--border-subtle)] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีข้อความ</p>
              <p className="text-xs text-[var(--text-muted)] mb-5">ส่ง SMS แรกของคุณเลย</p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/dashboard/send" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
                  ส่ง SMS
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* ═══ SMS 7-Day Chart ═══ */}
      <motion.div variants={fadeUp} className="glass p-6 mt-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-pink-500/10 border border-violet-500/10 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <span className="gradient-text-mixed">SMS 7 วันล่าสุด</span>
        </h3>
        <AreaChart />
      </motion.div>

      {/* ═══ Monthly Overview with Progress Bars ═══ */}
      {stats?.thisMonth && stats.thisMonth.total > 0 && (
        <motion.div variants={fadeUp} className="glass p-6 mt-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              สรุปเดือนนี้
            </h3>
            <span className="text-xs text-[var(--text-muted)]">{stats.thisMonth.total.toLocaleString()} ข้อความ</span>
          </div>

          {/* Progress breakdown */}
          <div className="space-y-4">
            {[
              { label: "สำเร็จ", value: stats.thisMonth.delivered, color: "bg-emerald-500", textColor: "text-emerald-400", pct: Math.round((stats.thisMonth.delivered / stats.thisMonth.total) * 100) },
              { label: "ส่งแล้ว", value: stats.thisMonth.sent, color: "bg-cyan-500", textColor: "text-cyan-400", pct: Math.round((stats.thisMonth.sent / stats.thisMonth.total) * 100) },
              { label: "รอดำเนินการ", value: stats.thisMonth.pending, color: "bg-amber-500", textColor: "text-amber-400", pct: Math.round((stats.thisMonth.pending / stats.thisMonth.total) * 100) },
              { label: "ล้มเหลว", value: stats.thisMonth.failed, color: "bg-red-500", textColor: "text-red-400", pct: Math.round((stats.thisMonth.failed / stats.thisMonth.total) * 100) },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[var(--text-secondary)]">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${item.textColor}`}>{item.value.toLocaleString()}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{item.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${item.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    style={{ opacity: 0.8 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ System Status ═══ */}
      <motion.div variants={fadeUp} className="glass p-6 mt-6">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          สถานะระบบ
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "SMS Gateway", status: "operational", icon: "🟢" },
            { label: "OTP Service", status: "operational", icon: "🟢" },
            { label: "API Server", status: "operational", icon: "🟢" },
            { label: "Database", status: "operational", icon: "🟢" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <div>
                <p className="text-xs font-medium text-[var(--text-secondary)]">{s.label}</p>
                <p className="text-[10px] text-emerald-400/70">Operational</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
