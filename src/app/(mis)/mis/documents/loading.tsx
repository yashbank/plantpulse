import { Skeleton, SkeletonTable } from '@/components/mis/kit';

/** Mirrors documents: title, order filter, table. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl p-6" role="status" aria-live="polite" aria-label="Loading documents">
      <Skeleton className="mb-6 h-8 w-44" />
      <Skeleton className="mb-6 h-12 w-full max-w-xs rounded-xl" />
      <SkeletonTable rows={5} />
    </div>
  );
}
