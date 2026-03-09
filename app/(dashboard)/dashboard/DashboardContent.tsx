"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function AnimatedCounter({ value, duration = 1.2 }: { value: string; duration?: number }) {
  const numericValue = Number.parseInt(value.replace(/,/g, ""), 10);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (Number.isNaN(numericValue)) { setDisplay(value); return; }
    const end = numericValue;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.floor(eased * end);
      setDisplay(current.toLocaleString());
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplay(end.toLocaleString());
    };
    requestAnimationFrame(animate);
  }, [numericValue, duration, value]);

  return <>{display}</>;
}

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

const statCards = [
  {
    label: "เครดิตคงเหลือ",
    key: "credits" as const,
    delta: "+1,000",
    positive: true,
    sparkline: [2, 4, 3, 6, 8, 6, 4, 5, 7, 9],
    glass: "glass-cyan",
    color: "#22D3EE",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: "ส่งวันนี้",
    key: "sent" as const,
    delta: "+23.5%",
    positive: true,
    sparkline: [1, 3, 5, 4, 7, 5, 3, 4, 6, 8],
    glass: "glass-violet",
    color: "#8B5CF6",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "สำเร็จ",
    key: "delivered" as const,
    delta: "98.2%",
    positive: true,
    sparkline: [6, 8, 8, 9, 8, 9, 9, 9, 8, 9],
    glass: "glass-emerald",
    color: "#10B981",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    label: "ล้มเหลว",
    key: "failed" as const,
    delta: "1.8%",
    positive: false,
    sparkline: [1, 1, 0, 1, 0, 0, 1, 0, 0, 1],
    glass: "glass-rose",
    color: "#EF4444",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
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

  return (
    <motion.div
      className="p-6 md:p-8 max-w-[1200px]"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      {/* Greeting */}
      <motion.div className="mb-8" variants={fadeUp}>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          สวัสดี, <span className="gradient-text-mixed">{user.name}</span>
        </h2>
        <p className="text-sm text-[var(--text-muted)]">ภาพรวมการส่ง SMS วันนี้</p>
      </motion.div>

      {/* Stats Grid — Card-based, gap-6, rounded-2xl */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8" variants={stagger}>
        {statCards.map((stat) => (
          <motion.div
            key={stat.key}
            variants={fadeUp}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className={`${stat.glass} card-hover p-5`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                {stat.icon}
              </div>
              <span className={`text-xs font-medium ${stat.positive ? "text-emerald-400" : "text-red-400"}`}>
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
          </motion.div>
        ))}
      </motion.div>

      {/* Two-column layout: Quick Send + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Send — 2 cols */}
        <motion.div className="lg:col-span-2 glass p-6" variants={fadeUp}>
          <h3 className="text-base font-semibold mb-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border border-violet-500/10 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <span className="gradient-text-violet">ส่งด่วน</span>
          </h3>

          <div className="space-y-3">
            <div>
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
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">เบอร์ปลายทาง</label>
              <input type="text" className="input-glass" placeholder="0891234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">ข้อความ</label>
              <textarea
                className="input-glass resize-none"
                rows={3}
                placeholder="รหัส OTP ของคุณคือ {code}"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
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
            className="btn-primary w-full mt-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
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
            <motion.a
              href="/dashboard/messages"
              className="text-xs text-[var(--text-muted)] hover:text-violet-400 transition-colors flex items-center gap-1"
              whileHover={{ x: 3 }}
            >
              ดูทั้งหมด
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </motion.a>
          </div>

          {stats?.recentMessages && stats.recentMessages.length > 0 ? (
            <div className="space-y-2">
              {stats.recentMessages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--bg-surface)]/50 border border-[var(--border-subtle)] hover:border-[rgba(148,163,184,0.12)] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      msg.status === "delivered" ? "bg-emerald-400" :
                      msg.status === "failed" ? "bg-red-400" :
                      msg.status === "sent" ? "bg-blue-400" :
                      "bg-yellow-400"
                    }`} />
                    <span className="text-sm text-[var(--text-secondary)] font-mono">{msg.recipient}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[var(--text-muted)]">{msg.senderName}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">฿{msg.creditCost}</span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                      msg.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                      msg.status === "failed" ? "bg-red-500/10 text-red-400" :
                      msg.status === "sent" ? "bg-blue-500/10 text-blue-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>{
                      msg.status === "delivered" ? "สำเร็จ" :
                      msg.status === "failed" ? "ล้มเหลว" :
                      msg.status === "sent" ? "ส่งแล้ว" : "รอส่ง"
                    }</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)]">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">ยังไม่มีข้อความ</p>
              <p className="text-xs text-[var(--text-muted)] mb-5">ส่ง SMS แรกของคุณเลย</p>
              <motion.a
                href="/dashboard/send"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                ส่ง SMS
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </motion.a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
