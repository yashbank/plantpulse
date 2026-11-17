import { Skeleton, SkeletonTable } from '@/components/mis/kit';

/** Mirrors the audit log: title with count, toolbar card, then event rows. */
export default function ListLoading() {
  return (
    <div className="flex w-full flex-col gap-5" role="status" aria-live="polite" aria-label="Loading audit log">
      <div>
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <SkeletonTable rows={6} />
    </div>
  );
}
