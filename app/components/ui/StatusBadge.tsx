type StatusBadgeProps = {
  status: string;
  size?: "sm" | "md";
};

const statusConfig: Record<string, { badge: string; glow: string; label: string; dot: string }> = {
  delivered: {
    badge: "badge-glow-success",
    glow: "shadow-[0_0_6px_rgba(16,185,129,0.4)]",
    label: "ส่งสำเร็จ",
    dot: "bg-emerald-400",
  },
  sent: {
    badge: "badge-glow-info",
    glow: "shadow-[0_0_6px_rgba(96,165,250,0.4)]",
    label: "ส่งแล้ว",
    dot: "bg-blue-400",
  },
  pending: {
    badge: "badge-glow-warning",
    glow: "shadow-[0_0_6px_rgba(245,158,11,0.4)]",
    label: "รอส่ง",
    dot: "bg-yellow-400",
  },
  failed: {
    badge: "badge-glow-error",
    glow: "shadow-[0_0_6px_rgba(239,68,68,0.4)]",
    label: "ล้มเหลว",
    dot: "bg-red-400",
  },
  approved: {
    badge: "badge-glow-success",
    glow: "shadow-[0_0_6px_rgba(16,185,129,0.4)]",
    label: "อนุมัติแล้ว",
    dot: "bg-emerald-400",
  },
  rejected: {
    badge: "badge-glow-error",
    glow: "shadow-[0_0_6px_rgba(239,68,68,0.4)]",
    label: "ถูกปฏิเสธ",
    dot: "bg-red-400",
  },
  active: {
    badge: "badge-glow-success",
    glow: "shadow-[0_0_6px_rgba(16,185,129,0.4)]",
    label: "ใช้งาน",
    dot: "bg-emerald-400",
  },
  inactive: {
    badge: "badge-glow-error",
    glow: "shadow-[0_0_6px_rgba(239,68,68,0.4)]",
    label: "ปิดใช้งาน",
    dot: "bg-red-400",
  },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClasses = size === "sm" ? "text-[10px] px-2.5 py-0.5" : "text-xs px-3 py-1";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-semibold uppercase tracking-wider ${config.badge} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.glow}`} />
      {config.label}
    </span>
  );
}
