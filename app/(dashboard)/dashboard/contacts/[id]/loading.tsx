import { Skeleton, SkeletonText, SkeletonCard } from "@/components/skeletons/Skeleton";

export default function ContactDetailLoading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6 max-w-4xl">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-6 w-48" />
      </div>

      {/* Contact card */}
      <SkeletonCard className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonText variant="short" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Activity */}
      <SkeletonCard className="p-6">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <SkeletonText variant="long" />
                <SkeletonText variant="short" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
