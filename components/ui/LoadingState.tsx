"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Skeleton Primitives ─── */

function Shimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[rgba(255,255,255,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

/* ─── Variants ─── */

/** Full-page spinner — use for initial page loads */
export function PageLoading({ message = "กำลังโหลด..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
      <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
}

/** Section spinner — use inside a card/section that is loading */
export function SectionLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10">
      <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin" />
      {message && <span className="text-sm text-[var(--text-muted)]">{message}</span>}
    </div>
  );
}

/** Inline loading — use next to a button or inside a row */
export function InlineLoading({ message }: { message?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      {message}
    </span>
  );
}

/** Stats skeleton — 4 stat cards */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4 mb-4", count <= 2 ? "sm:grid-cols-2" : "grid-cols-2 md:grid-cols-4")}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-4"
        >
          <Shimmer className="h-9 w-9 rounded-md mb-3" />
          <Shimmer className="h-7 w-20 rounded mb-2" />
          <Shimmer className="h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Table skeleton — header + rows */
export function TableLoadingSkeleton({
  columns = 5,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-[var(--table-header)]">
        {Array.from({ length: columns }).map((_, i) => (
          <Shimmer key={`h-${i}`} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`r-${r}`}
          className={cn(
            "flex gap-4 px-4 py-3.5 border-t border-[var(--border-default)]",
            r % 2 === 1 && "bg-[var(--table-alt-row)]",
          )}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Shimmer key={`r-${r}-c-${c}`} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card skeleton — generic card placeholder */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-5",
        className,
      )}
    >
      <Shimmer className="h-4 w-24 rounded mb-3" />
      <Shimmer className="h-8 w-32 rounded mb-2" />
      <Shimmer className="h-3 w-48 rounded" />
    </div>
  );
}

/** Dashboard loading — stats + table combo */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <StatsSkeleton />
      <TableLoadingSkeleton />
    </div>
  );
}
