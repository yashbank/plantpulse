import { Skeleton, SkeletonTable } from '@/components/mis/kit';

/** Mirrors a master list: title with an Add button, search row, table. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite" aria-label="Loading masters">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-11 w-24" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <SkeletonTable rows={6} />
    </div>
  );
}
