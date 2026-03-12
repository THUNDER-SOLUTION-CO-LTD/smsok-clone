"use client";

import { type OrderStatus, ORDER_STATUS_CONFIG } from "@/types/order";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ color: config.color, backgroundColor: config.bgColor }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: config.dot,
          animation:
            status === "PENDING_REVIEW" ? "pulse 2s infinite" : undefined,
        }}
      />
      {config.label}
    </span>
  );
}
