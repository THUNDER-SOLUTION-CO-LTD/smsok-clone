import { Skeleton, SkeletonText, SkeletonCard } from "@/components/skeletons/Skeleton";

export default function OrderDetailLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6 max-w-4xl">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-6 w-56" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Order details */}
        <div className="lg:col-span-3 space-y-6">
          <SkeletonCard className="p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <SkeletonText variant="medium" />
                  <SkeletonText variant="short" />
                </div>
              ))}
            </div>
          </SkeletonCard>

          <SkeletonCard className="p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </SkeletonCard>
        </div>

        {/* Price summary */}
        <div className="lg:col-span-2">
          <SkeletonCard className="p-6">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <SkeletonText variant="medium" />
                  <SkeletonText variant="short" />
                </div>
              ))}
            </div>
            <Skeleton className="h-11 w-full rounded-lg mt-6" />
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
