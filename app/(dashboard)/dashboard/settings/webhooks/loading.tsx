import { Skeleton, SkeletonCard, SkeletonText } from "@/components/skeletons/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-6 w-[180px]" />
        <Skeleton className="h-4 w-[260px]" />
      </div>
      <SkeletonCard className="p-6">
        <div className="space-y-4">
          <SkeletonText variant="medium" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <SkeletonText variant="medium" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-[120px] rounded-lg" />
        </div>
      </SkeletonCard>
    </div>
  );
}
