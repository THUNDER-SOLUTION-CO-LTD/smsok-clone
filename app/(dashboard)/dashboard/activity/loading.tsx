import { Skeleton, TableSkeleton } from "@/components/skeletons/Skeleton";

export default function Loading() {
  return (
    <div className="px-8 py-6 max-md:px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-[160px]" />
          <Skeleton className="h-4 w-[220px]" />
        </div>
        <Skeleton className="h-10 w-[120px] rounded-lg" />
      </div>
      <TableSkeleton columns={4} rows={6} />
    </div>
  );
}
