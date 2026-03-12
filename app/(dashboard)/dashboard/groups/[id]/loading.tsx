import { Skeleton, SkeletonText, SkeletonCard, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function GroupDetailLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6 max-w-5xl">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Group info */}
      <SkeletonCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <SkeletonText variant="long" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <Skeleton className="h-8 w-16 mx-auto" />
              <SkeletonText variant="short" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Members table */}
      <TableSkeleton columns={4} rows={8} />
    </div>
  );
}
