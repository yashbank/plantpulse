import { Skeleton, SkeletonKpi, SkeletonTable } from '@/components/mis/kit/skeleton';

/** Shown while this list resolves: header, KPI strip, toolbar card, then table rows. */
export default function ListLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <SkeletonKpi count={4} />
      <Skeleton className="h-20 w-full" />
      <SkeletonTable />
    </div>
  );
}
