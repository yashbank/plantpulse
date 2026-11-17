import { Skeleton, SkeletonKpi, SkeletonList, SkeletonTable } from '@/components/mis/kit/skeleton';

/** List loading: header, summary cards, filter bar, then rows (cards on a phone, table from md up). */
export default function ListLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <SkeletonKpi count={3} />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="md:hidden">
        <SkeletonList rows={4} />
      </div>
      <div className="hidden md:block">
        <SkeletonTable rows={5} />
      </div>
    </div>
  );
}
