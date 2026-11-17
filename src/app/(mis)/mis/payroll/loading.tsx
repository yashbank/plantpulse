import { Skeleton, SkeletonList } from '@/components/mis/kit';

/** Mirrors payroll: month card, tab strip, summary card. */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-24 lg:max-w-7xl" role="status" aria-live="polite" aria-label="Loading payroll">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full" />
      <SkeletonList rows={4} />
    </div>
  );
}
