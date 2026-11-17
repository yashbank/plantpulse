import { Skeleton, SkeletonKpi, SkeletonTable } from '@/components/mis/kit';

/** Mirrors reports: title with range controls, KPI tiles, tab strip, table. */
export default function Loading() {
  return (
    <div className="p-6" role="status" aria-live="polite" aria-label="Loading reports">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-11 w-64 max-w-full" />
      </div>
      <SkeletonKpi count={4} className="mb-8 md:grid-cols-4" />
      <Skeleton className="mb-6 h-11 w-full" />
      <SkeletonTable rows={3} />
    </div>
  );
}
