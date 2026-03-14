import { Skeleton } from "@/components/ui/skeleton";

export default function PageSkeleton() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 bg-[var(--border-default)]" />
          <Skeleton className="h-4 w-72 bg-[var(--border-default)]" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg bg-[var(--border-default)]" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Table */}
      <TableSkeleton />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      className="rounded-lg p-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-20 bg-[var(--border-default)]" />
        <Skeleton className="h-8 w-8 rounded-lg bg-[var(--border-default)]" />
      </div>
      <Skeleton className="h-7 w-24 bg-[var(--border-default)]" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <Skeleton className="h-3 w-24 bg-[var(--border-default)]" />
        <Skeleton className="h-3 w-20 bg-[var(--border-default)]" />
        <Skeleton className="h-3 w-16 bg-[var(--border-default)] hidden sm:block" />
        <Skeleton className="h-3 w-20 bg-[var(--border-default)] hidden md:block" />
        <Skeleton className="h-3 w-12 bg-[var(--border-default)] ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5"
          style={{ borderBottom: i < rows - 1 ? "1px solid var(--border-default)" : undefined }}
        >
          <Skeleton className="h-4 w-32 bg-[var(--border-default)]" />
          <Skeleton className="h-4 w-20 bg-[var(--border-default)]" />
          <Skeleton className="h-4 w-16 bg-[var(--border-default)] hidden sm:block" />
          <Skeleton className="h-4 w-24 bg-[var(--border-default)] hidden md:block" />
          <Skeleton className="h-6 w-6 rounded bg-[var(--border-default)] ml-auto" />
        </div>
      ))}
    </div>
  );
}
