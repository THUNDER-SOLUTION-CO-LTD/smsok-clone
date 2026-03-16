import { Skeleton, SkeletonCard, SkeletonText } from "@/components/skeletons/Skeleton";

export default function Loading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[140px]" />
        </div>
      </div>
      <SkeletonCard className="p-6">
        <div className="space-y-4">
          <SkeletonText variant="long" />
          <SkeletonText variant="medium" />
          <SkeletonText variant="full" />
          <SkeletonText variant="long" />
        </div>
      </SkeletonCard>
    </div>
  );
}
