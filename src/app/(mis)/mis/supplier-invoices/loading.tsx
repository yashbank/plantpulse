import { Skeleton, SkeletonKpi, SkeletonTable } from '@/components/mis/kit/skeleton';

/** Shown while this list resolves, matching the real layout: page header, KPI strip, toolbar, then table rows. */
export default function ListLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Skeleton className="h-9 w-56" />
      <SkeletonKpi count={4} />
      <Skeleton className="h-12 w-full max-w-sm" />
      <SkeletonTable />
    </div>
  );
}
