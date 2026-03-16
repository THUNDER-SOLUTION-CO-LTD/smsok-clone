import { Skeleton, SkeletonCard } from "@/components/skeletons/Skeleton";

export default function Loading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-[160px]" />
        <Skeleton className="h-4 w-[240px]" />
      </div>
      <SkeletonCard className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-[140px] rounded-lg" />
        </div>
      </SkeletonCard>
    </div>
  );
}
