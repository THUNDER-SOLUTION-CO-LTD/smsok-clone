"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  MousePointerClick,
  Loader2,
  Send,
  Link2,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ─── Types ─── */

type CampaignAnalytics = {
  campaign: {
    id: string;
    name: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    durationSeconds: number | null;
  };
  delivery: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  deliveryRate: number;
  clicks: {
    totalClicks: number;
    uniqueLinks: number;
    ctr: number;
  };
  cost: {
    totalSmsSegments: number;
    totalRecipients: number;
    creditReserved: number;
    creditUsed: number;
  };
};

/* ─── Helpers ─── */

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds} วินาที`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาที ${seconds % 60} วินาที`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} ชม. ${m} นาที`;
}

function formatThaiDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/* ─── Stat Card ─── */

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  valueColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center"
            style={{ background: iconBg }}
          >
            {icon}
          </div>
          <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-[0.04em]">
            {label}
          </span>
        </div>
        <div
          className="text-2xl font-bold tabular-nums"
          style={{ color: valueColor || "var(--text-primary)" }}
        >
          {value}
        </div>
        {sub && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-[var(--text-muted)]">{entry.name}</span>
          <span className="font-semibold text-[var(--text-primary)] ml-auto">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ─── Main ─── */

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/campaigns/${campaignId}/analytics`);
        if (!res.ok) {
          setError("ไม่สามารถโหลดข้อมูลวิเคราะห์ได้");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        <span className="text-[13px] text-[var(--text-muted)]">
          กำลังโหลดข้อมูลวิเคราะห์...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-12 h-12 text-[var(--error)] mx-auto mb-3" />
        <p className="text-[var(--text-secondary)]">{error || "ไม่พบข้อมูล"}</p>
        <Button
          variant="outline"
          className="mt-4 border-[var(--border-default)] text-[var(--text-secondary)]"
          onClick={() => router.push(`/dashboard/campaigns/${campaignId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          กลับ
        </Button>
      </div>
    );
  }

  const { campaign, delivery, deliveryRate, clicks, cost } = data;

  // Delivery breakdown for bar chart
  const deliveryChartData = [
    { name: "ส่งแล้ว", value: delivery.sent, color: "var(--accent-secondary)" },
    { name: "สำเร็จ", value: delivery.delivered, color: "var(--success)" },
    { name: "ล้มเหลว", value: delivery.failed, color: "var(--error)" },
    { name: "รอดำเนินการ", value: delivery.pending, color: "var(--warning)" },
  ];

  // Pie chart data for delivery status
  const pieData = [
    { name: "สำเร็จ", value: delivery.delivered, color: "var(--success)" },
    { name: "ล้มเหลว", value: delivery.failed, color: "var(--error)" },
    { name: "รอดำเนินการ", value: delivery.pending, color: "var(--warning)" },
  ].filter((d) => d.value > 0);

  const statusLabel: Record<string, { text: string; color: string }> = {
    draft: { text: "ฉบับร่าง", color: "var(--text-muted)" },
    scheduled: { text: "ตั้งเวลา", color: "var(--info)" },
    sending: { text: "กำลังส่ง", color: "var(--accent)" },
    running: { text: "กำลังส่ง", color: "var(--accent)" },
    completed: { text: "สำเร็จ", color: "var(--success)" },
    failed: { text: "ล้มเหลว", color: "var(--error)" },
    cancelled: { text: "ยกเลิก", color: "var(--error)" },
    paused: { text: "หยุดชั่วคราว", color: "var(--warning)" },
  };

  const st = statusLabel[campaign.status] || statusLabel.draft;

  return (
    <div>
      {/* Back nav */}
      <button
        type="button"
        onClick={() => router.push(`/dashboard/campaigns/${campaignId}`)}
        className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับไปรายละเอียดแคมเปญ
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(var(--accent-rgb),0.08)] border border-[rgba(var(--accent-rgb),0.15)] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              วิเคราะห์แคมเปญ
            </h1>
            <p className="text-xs text-[var(--text-muted)]">{campaign.name}</p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-medium px-2.5 py-1"
          style={{
            background: `color-mix(in srgb, ${st.color} 10%, transparent)`,
            color: st.color,
          }}
        >
          {st.text}
        </span>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Send className="w-4 h-4 text-[var(--accent)]" />}
          iconBg="rgba(var(--accent-rgb),0.08)"
          label="ส่งทั้งหมด"
          value={delivery.total.toLocaleString()}
          sub={`จาก ${cost.totalRecipients.toLocaleString()} ผู้รับ`}
        />
        <StatCard
          icon={<CheckCircle className="w-4 h-4 text-[var(--success)]" />}
          iconBg="rgba(var(--success-rgb),0.08)"
          label="อัตราส่งสำเร็จ"
          value={`${deliveryRate}%`}
          sub={`${delivery.delivered.toLocaleString()} สำเร็จ`}
          valueColor="var(--success)"
        />
        <StatCard
          icon={
            <MousePointerClick className="w-4 h-4 text-[var(--accent-secondary)]" />
          }
          iconBg="rgba(var(--accent-blue-rgb),0.08)"
          label="Click-Through Rate"
          value={`${clicks.ctr}%`}
          sub={`${clicks.totalClicks.toLocaleString()} คลิก · ${clicks.uniqueLinks} ลิงก์`}
          valueColor="var(--accent-secondary)"
        />
        <StatCard
          icon={<Zap className="w-4 h-4 text-[var(--warning)]" />}
          iconBg="rgba(var(--warning-rgb),0.08)"
          label="โควต้าที่ใช้"
          value={cost.creditUsed.toLocaleString()}
          sub={`สำรอง ${cost.creditReserved.toLocaleString()} · ${cost.totalSmsSegments} segments`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* Delivery Bar Chart */}
        <Card className="lg:col-span-3 bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              สถานะการส่ง
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={deliveryChartData}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 9 }}
                  width={45}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="value" name="จำนวน" radius={[4, 4, 0, 0]}>
                  {deliveryChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Delivery Pie Chart */}
        <Card className="lg:col-span-2 bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              สัดส่วนการส่ง
            </h3>
            {pieData.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        Number(value).toLocaleString(),
                        "ข้อความ",
                      ]}
                      contentStyle={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-default)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {pieData.map((d) => (
                    <span
                      key={d.name}
                      className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: d.color }}
                      />
                      {d.name}: {d.value.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[180px] text-xs text-[var(--text-muted)]">
                ยังไม่มีข้อมูล
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline & Cost Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Timeline */}
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              ไทม์ไลน์
            </h3>
            <div className="space-y-3">
              {[
                {
                  icon: Clock,
                  color: "var(--text-muted)",
                  label: "เริ่มส่ง",
                  value: formatThaiDate(campaign.startedAt),
                },
                {
                  icon: CheckCircle,
                  color: "var(--success)",
                  label: "ส่งเสร็จ",
                  value: formatThaiDate(campaign.completedAt),
                },
                {
                  icon: Zap,
                  color: "var(--warning)",
                  label: "ระยะเวลา",
                  value: formatDuration(campaign.durationSeconds),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{
                        background: `color-mix(in srgb, ${item.color} 10%, transparent)`,
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{ color: item.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {item.label}
                      </p>
                      <p className="text-sm text-[var(--text-primary)]">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Click Tracking */}
        <Card className="bg-[var(--bg-surface)] border-[var(--border-default)] rounded-lg">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              การคลิกลิงก์
            </h3>
            {clicks.totalClicks > 0 || clicks.uniqueLinks > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]">
                    <p className="text-xl font-bold text-[var(--accent-secondary)] tabular-nums">
                      {clicks.totalClicks.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      คลิกทั้งหมด
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]">
                    <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums">
                      {clicks.uniqueLinks}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      ลิงก์ทั้งหมด
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)]">
                    <p className="text-xl font-bold text-[var(--accent)] tabular-nums">
                      {clicks.ctr}%
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      CTR
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  CTR คำนวณจาก คลิกทั้งหมด ÷ ข้อความที่ส่งสำเร็จ ×
                  100
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Link2 className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                <p className="text-xs text-[var(--text-muted)]">
                  ไม่มีลิงก์ติดตามในแคมเปญนี้
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
