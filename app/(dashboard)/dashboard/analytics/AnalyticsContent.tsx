"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  BarChart3,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
} from "lucide-react";

type Stats = {
  user: { name: string; email: string };
  today: { total: number; delivered: number; failed: number; sent: number; pending: number };
  thisMonth: { total: number; delivered: number; failed: number; sent: number; pending: number };
  recentMessages: { id: string; recipient: string; status: string; senderName: string; creditCost: number; createdAt: Date }[];
  smsRemaining?: number;
};

type Period = "today" | "7d" | "30d" | "month";

type DailyDataPoint = {
  date: string;
  label: string;
  sent: number;
  delivered: number;
  failed: number;
};

// ── Donut Chart ──

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;
  const circ = 2 * Math.PI * r;

  const segments = data
    .filter((d) => d.value > 0)
    .reduce<Array<{ label: string; value: number; color: string; pct: number; dashLen: number; dashOffset: number }>>(
      (acc, d) => {
        const used = acc.reduce((sum, seg) => sum + seg.dashLen, 0);
        const pct = d.value / total;
        const dashLen = circ * pct;
        acc.push({ ...d, pct, dashLen, dashOffset: circ - used });
        return acc;
      },
      []
    );

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(var(--border-default-rgb,40,45,55),0.3)" strokeWidth="18" />
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={`${seg.dashLen} ${circ - seg.dashLen}`}
              strokeDashoffset={seg.dashOffset}
              style={{ transition: "stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease" }}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
            {total.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            ข้อความทั้งหมด
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{seg.label}</span>
            <span className="text-[12px] font-bold tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {Math.round(seg.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress Bar ──

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold font-mono tabular-nums" style={{ color }}>
            {value.toLocaleString()}
          </span>
          <span className="text-[11px] font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>
            ({Math.round(pct)}%)
          </span>
        </div>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(var(--border-default-rgb,40,45,55),0.3)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            width: `${pct}%`,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Stat Card ──

function StatCard({
  label,
  value,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <div
      className="relative rounded-lg p-5 overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.5 }}
      />
      {/* Icon glow */}
      <div
        className="absolute pointer-events-none"
        style={{ top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(${color} 0%, transparent 70%)`, opacity: 0.06 }}
      />
      <div className="flex items-center justify-between mb-3 relative">
        <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}14` }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2 relative">
        <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {trend && (
          <span
            className="flex items-center gap-0.5 text-[11px] font-semibold mb-1"
            style={{ color: trend.positive ? "var(--success)" : "var(--error)" }}
          >
            {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── Line Chart (SVG) ──

function LineChart({ data }: { data: DailyDataPoint[] }) {
  if (data.length === 0) return null;

  const w = 600;
  const h = 200;
  const px = 40;
  const py = 20;
  const chartW = w - px * 2;
  const chartH = h - py * 2;

  const maxVal = Math.max(...data.map((d) => Math.max(d.sent, d.delivered, d.failed)), 1);
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  function toPath(key: "sent" | "delivered" | "failed") {
    return data
      .map((d, i) => {
        const x = px + i * stepX;
        const y = py + chartH - (d[key] / maxVal) * chartH;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }

  const lines: { key: "sent" | "delivered" | "failed"; color: string; label: string }[] = [
    { key: "sent", color: "var(--accent)", label: "ส่งทั้งหมด" },
    { key: "delivered", color: "var(--success)", label: "สำเร็จ" },
    { key: "failed", color: "var(--error)", label: "ล้มเหลว" },
  ];

  // Y-axis grid lines
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = Math.round((maxVal / gridCount) * i);
    const y = py + chartH - (val / maxVal) * chartH;
    return { val, y };
  });

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h + 30}`} className="w-full h-auto">
        {/* Grid */}
        {gridLines.map((g) => (
          <g key={g.val}>
            <line x1={px} y1={g.y} x2={w - px} y2={g.y} stroke="rgba(var(--border-default-rgb,40,45,55),0.3)" strokeDasharray="4" />
            <text x={px - 6} y={g.y + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">{g.val}</text>
          </g>
        ))}
        {/* Lines */}
        {lines.map((line) => (
          <path key={line.key} d={toPath(line.key)} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {/* Dots */}
        {lines.map((line) =>
          data.map((d, i) => (
            <circle key={`${line.key}-${i}`} cx={px + i * stepX} cy={py + chartH - (d[line.key] / maxVal) * chartH} r="3" fill={line.color} />
          ))
        )}
        {/* X labels */}
        {data.map((d, i) => (
          <text key={i} x={px + i * stepX} y={h + 20} textAnchor="middle" fill="var(--text-muted)" fontSize="10">{d.label}</text>
        ))}
      </svg>
      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2">
        {lines.map((line) => (
          <div key={line.key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{line.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──

export default function AnalyticsContent({ stats }: { stats: Stats }) {
  const [period, setPeriod] = useState<Period>("today");
  const [dailyData, setDailyData] = useState<DailyDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Fetch daily chart data
  useEffect(() => {
    let cancelled = false;
    async function fetchDaily() {
      setChartLoading(true);
      try {
        const days = period === "today" ? 1 : period === "7d" ? 7 : 30;
        const res = await fetch(`/api/v1/analytics/daily?days=${days}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled && Array.isArray(json.data)) {
          setDailyData(
            json.data.map((d: { date: string; sent: number; delivered: number; failed: number }) => ({
              date: d.date,
              label: new Date(d.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
              sent: d.sent ?? 0,
              delivered: d.delivered ?? 0,
              failed: d.failed ?? 0,
            }))
          );
        }
      } catch {
        if (!cancelled) setDailyData([]);
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    }
    fetchDaily();
    return () => { cancelled = true; };
  }, [period]);

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const rows = [
      ["สถานะ", "เบอร์ผู้รับ", "ผู้ส่ง", "เครดิต (SMS)", "วันที่"],
      ...stats.recentMessages.map((msg) => [
        msg.status,
        msg.recipient,
        msg.senderName,
        String(msg.creditCost),
        new Date(msg.createdAt).toLocaleString("th-TH"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smsok-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats.recentMessages]);

  const data = period === "today" ? stats.today : stats.thisMonth;
  const totalMessages = data.total;
  const successRate = totalMessages > 0 ? Math.round((data.delivered / totalMessages) * 100) : 0;
  const failRate = totalMessages > 0 ? Math.round((data.failed / totalMessages) * 100) : 0;

  const donutData = [
    { label: "สำเร็จ", value: data.delivered, color: "var(--success)" },
    { label: "ส่งแล้ว", value: data.sent, color: "var(--accent)" },
    { label: "รอส่ง", value: data.pending, color: "var(--warning)" },
    { label: "ล้มเหลว", value: data.failed, color: "var(--error)" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in-up">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Marketing Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            วิเคราะห์ประสิทธิภาพแคมเปญ SMS แบบ real-time
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period Toggle */}
          <div
            className="inline-flex rounded-lg p-0.5"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-default)" }}
          >
            {([
              { key: "today" as Period, label: "วันนี้" },
              { key: "7d" as Period, label: "7 วัน" },
              { key: "30d" as Period, label: "30 วัน" },
              { key: "month" as Period, label: "เดือนนี้" },
            ]).map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className="px-3 py-2 rounded-md text-[13px] font-medium transition-all cursor-pointer"
                style={{
                  background: period === p.key ? "rgba(var(--accent-rgb),0.1)" : "transparent",
                  color: period === p.key ? "var(--accent)" : "var(--text-muted)",
                  border: period === p.key ? "1px solid rgba(var(--accent-rgb),0.15)" : "1px solid transparent",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border-default)",
            }}
          >
            <Download size={14} />
            Export CSV
          </button>
          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{
              background: "var(--accent)",
              color: "var(--bg-base)",
            }}
          >
            <Zap size={14} />
            สร้างแคมเปญ
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
        <StatCard
          label="ส่งทั้งหมด"
          value={totalMessages}
          icon={<Send size={16} style={{ color: "var(--accent)" }} />}
          color="var(--accent)"
        />
        <StatCard
          label="สำเร็จ"
          value={data.delivered}
          icon={<CheckCircle2 size={16} style={{ color: "var(--success)" }} />}
          color="var(--success)"
        />
        <StatCard
          label="อัตราสำเร็จ"
          value={`${successRate}%`}
          icon={<TrendingUp size={16} style={{ color: "var(--accent)" }} />}
          color="var(--accent)"
        />
        <StatCard
          label="ล้มเหลว"
          value={data.failed}
          icon={<XCircle size={16} style={{ color: "var(--error)" }} />}
          color="var(--error)"
        />
      </div>

      {/* ── SMS Remaining Banner ── */}
      <div
        className="rounded-lg p-4 mb-6 flex items-center justify-between"
        style={{
          background: "rgba(var(--accent-rgb),0.04)",
          border: "1px solid rgba(var(--accent-rgb),0.12)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(var(--accent-rgb),0.1)" }}
          >
            <Activity size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>SMS คงเหลือ</p>
            <p className="text-lg font-bold font-mono tabular-nums" style={{ color: "var(--accent)" }}>
              {(stats.smsRemaining ?? 0).toLocaleString()} <span className="text-[13px] font-normal">SMS</span>
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/billing/packages"
          className="text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          style={{
            color: "var(--accent)",
            background: "rgba(var(--accent-rgb),0.08)",
            border: "1px solid rgba(var(--accent-rgb),0.15)",
          }}
        >
          เติมเครดิต
        </Link>
      </div>

      {/* ── Two Column: Donut + Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Donut Chart Card */}
        <div
          className="relative rounded-lg p-6 overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)", opacity: 0.3 }}
          />
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={16} style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              สัดส่วนสถานะ
            </h3>
          </div>
          {totalMessages > 0 ? (
            <DonutChart data={donutData} />
          ) : (
            <div className="text-center py-16">
              <BarChart3 size={36} style={{ color: "var(--border-default)" }} className="mx-auto mb-3" />
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>ยังไม่มีข้อมูล</p>
            </div>
          )}
        </div>

        {/* Breakdown Bars Card */}
        <div
          className="relative rounded-lg p-6 overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, transparent, var(--accent-secondary), transparent)", opacity: 0.3 }}
          />
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} style={{ color: "var(--accent-secondary)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              รายละเอียดการส่ง
            </h3>
          </div>
          <div className="space-y-5">
            <ProgressBar label="สำเร็จ (Delivered)" value={data.delivered} max={totalMessages} color="var(--success)" />
            <ProgressBar label="ส่งแล้ว (Sent)" value={data.sent} max={totalMessages} color="var(--accent)" />
            <ProgressBar label="รอดำเนินการ (Pending)" value={data.pending} max={totalMessages} color="var(--warning)" />
            <ProgressBar label="ล้มเหลว (Failed)" value={data.failed} max={totalMessages} color="var(--error)" />
          </div>

          {/* Fail rate alert */}
          {failRate > 10 && totalMessages > 0 && (
            <div
              className="mt-5 p-3 rounded-md flex items-center gap-2"
              style={{
                background: "rgba(var(--error-rgb),0.06)",
                border: "1px solid rgba(var(--error-rgb),0.15)",
              }}
            >
              <XCircle size={14} style={{ color: "var(--error)" }} />
              <p className="text-[12px]" style={{ color: "var(--error)" }}>
                อัตราล้มเหลวสูง ({failRate}%) — ตรวจสอบเบอร์ผู้รับหรือผู้ส่ง
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Daily Trend Chart ── */}
      <div
        className="relative rounded-lg p-6 overflow-hidden mb-6"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, var(--accent-blue, var(--accent)), transparent)", opacity: 0.3 }}
        />
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={16} style={{ color: "var(--accent)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            แนวโน้มการส่ง SMS รายวัน
          </h3>
        </div>
        {chartLoading ? (
          <div className="text-center py-12">
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>กำลังโหลดกราฟ...</p>
          </div>
        ) : dailyData.length > 0 ? (
          <LineChart data={dailyData} />
        ) : (
          <div className="text-center py-12">
            <BarChart3 size={36} style={{ color: "var(--border-default)" }} className="mx-auto mb-3" />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>ยังไม่มีข้อมูลรายวัน</p>
          </div>
        )}
      </div>

      {/* ── Recent Activity ── */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent, var(--accent-focus), transparent)", opacity: 0.3 }}
        />
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: "var(--accent-focus)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              กิจกรรมล่าสุด
            </h3>
          </div>
          <Link
            href="/dashboard/messages"
            className="text-[12px] font-medium flex items-center gap-1 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ดูทั้งหมด
            <ArrowUpRight size={12} />
          </Link>
        </div>

        {stats.recentMessages.length > 0 ? (
          <div className="p-4">
            <table className="nansen-table-dense w-full">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>สถานะ</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>เบอร์ผู้รับ</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>ผู้ส่ง</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>เครดิต</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentMessages.slice(0, 8).map((msg) => {
                  const statusMap: Record<string, { color: string; label: string }> = {
                    delivered: { color: "var(--success)", label: "สำเร็จ" },
                    sent: { color: "var(--accent)", label: "ส่งแล้ว" },
                    pending: { color: "var(--warning)", label: "รอส่ง" },
                    failed: { color: "var(--error)", label: "ล้มเหลว" },
                  };
                  const s = statusMap[msg.status] || statusMap.pending;
                  return (
                    <tr key={msg.id} style={{ borderTop: "1px solid var(--border-default)" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          <span className="text-[12px] font-medium" style={{ color: s.color }}>{s.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-mono tabular-nums" style={{ color: "var(--text-primary)" }}>{msg.recipient}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>{msg.senderName}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[12px] font-mono tabular-nums" style={{ color: "var(--text-secondary)" }}>{msg.creditCost} SMS</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-6">
            <Send size={36} style={{ color: "var(--border-default)" }} className="mx-auto mb-3" />
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>ยังไม่มีข้อความ</p>
            <p className="text-[12px] mb-4" style={{ color: "var(--text-muted)" }}>เริ่มส่ง SMS แรกเพื่อดูสถิติที่นี่</p>
            <Link
              href="/dashboard/send"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold"
              style={{ background: "var(--accent)", color: "var(--bg-base)" }}
            >
              <Send size={14} />
              ส่ง SMS แรก
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
