"use client";

import { useState } from "react";
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

const statCards = [
  {
    label: "เครดิต",
    key: "credits" as const,
    delta: "+1,000",
    deltaColor: "text-emerald-400",
    sparkline: [2, 4, 3, 6, 8, 6, 4, 5, 7, 9],
    gradient: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-400">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    label: "ส่งแล้ว",
    key: "sent" as const,
    delta: "+23.5%",
    deltaColor: "text-emerald-400",
    sparkline: [1, 3, 5, 4, 7, 5, 3, 4, 6, 8],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-400/60">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  {
    label: "สำเร็จ",
    key: "delivered" as const,
    delta: "98.2%",
    deltaColor: "text-emerald-400",
    sparkline: [6, 8, 8, 9, 8, 9, 9, 9, 8, 9],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400/60">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    label: "ล้มเหลว",
    key: "failed" as const,
    delta: "1.8%",
    deltaColor: "text-red-400",
    sparkline: [1, 1, 0, 1, 0, 0, 1, 0, 0, 1],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400/60">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
];

function Sparkline({ data, color = "#38BDF8" }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const h = 24;
  return (
    <div className="flex items-end gap-[3px] h-6">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-[4px] rounded-full transition-all duration-300"
          style={{
            height: `${Math.max((v / max) * h, 2)}px`,
            backgroundColor: color,
            opacity: 0.3 + (v / max) * 0.7,
          }}
        />
      ))}
    </div>
  );
}

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
    <div className="p-6 md:p-8 max-w-6xl">
          {/* Greeting */}
          <div className="mb-8 animate-fade-in">
            <p className="text-white/30 text-sm">สวัสดี, <span className="text-white/60">{user.name}</span></p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, i) => (
              <div
                key={stat.key}
                className={`glass card-glow p-5 group transition-all duration-300 animate-fade-in ${
                  stat.gradient ? "border-sky-500/20 shadow-[0_0_30px_rgba(56,189,248,0.06)]" : ""
                }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {stat.icon}
                    <span className="text-[11px] text-white/30 uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <span className={`text-[11px] font-medium ${stat.deltaColor}`}>{stat.delta}</span>
                </div>
                <div className={`text-2xl font-bold mb-3 ${stat.gradient ? "neon-blue" : "text-white"}`}>
                  {statValues[stat.key]}
                </div>
                <Sparkline data={stat.sparkline} color={stat.key === "failed" ? "#EF4444" : "#38BDF8"} />
              </div>
            ))}
          </div>

          {/* Quick Send */}
          <div className="glass p-6 md:p-8 mb-8 animate-fade-in" style={{ animationDelay: "0.35s" }}>
            <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/[0.08] border border-sky-500/10 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              ส่งด่วน
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">ชื่อผู้ส่ง</label>
                <div className="relative">
                  <select
                    className="input-glass cursor-pointer appearance-none pr-10"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  >
                    {senderNames.map((name) => (
                      <option key={name} value={name} className="bg-[#0a0f1a] text-white">
                        {name === "EasySlip" ? "EasySlip (ค่าเริ่มต้น)" : name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">เบอร์ปลายทาง</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="0891234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-white/30 uppercase tracking-wider mb-2 font-medium">ข้อความ</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="รหัส OTP ของคุณคือ {code}"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
            {sendResult && (
              <p className={`mt-3 text-xs font-medium ${sendResult.includes("สำเร็จ") ? "text-emerald-400" : "text-red-400"}`}>{sendResult}</p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleQuickSend}
                disabled={sending || !phone || !message}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    กำลังส่ง...
                  </span>
                ) : (
                  <>
                    ส่ง SMS
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recent Messages */}
          <div className="glass p-6 md:p-8 animate-fade-in" style={{ animationDelay: "0.45s" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/[0.08] border border-sky-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                ข้อความล่าสุด
              </h2>
              <a href="/dashboard/messages" className="text-xs text-sky-400/80 hover:text-sky-300 transition-colors flex items-center gap-1">
                ดูทั้งหมด
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {stats?.recentMessages && stats.recentMessages.length > 0 ? (
              <div className="space-y-2">
                {stats.recentMessages.map((msg) => (
                  <div key={msg.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.015] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.06] transition-all">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        msg.status === "delivered" ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]" :
                        msg.status === "failed" ? "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.4)]" :
                        msg.status === "sent" ? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.4)]" :
                        "bg-yellow-400 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                      }`} />
                      <span className="text-sm text-white/50 font-mono">{msg.recipient}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/20">{msg.senderName}</span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        msg.status === "delivered" ? "bg-emerald-500/10 text-emerald-400" :
                        msg.status === "failed" ? "bg-red-500/10 text-red-400" :
                        msg.status === "sent" ? "bg-blue-500/10 text-blue-400" :
                        "bg-yellow-500/10 text-yellow-400"
                      }`}>{msg.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/10">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <p className="text-sm text-white/25 mb-1">ยังไม่มีข้อความ</p>
                <p className="text-xs text-white/15 mb-5">ส่ง SMS แรกของคุณเลย</p>
                <a href="/dashboard/send" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
                  ส่ง SMS
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            )}
          </div>
    </div>
  );
}
