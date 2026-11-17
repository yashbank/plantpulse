import { Skeleton, SkeletonList } from '@/components/mis/kit';

/** Mirrors the approval queue: title, then a section heading over a list of rows. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl p-6" role="status" aria-live="polite" aria-label="Loading approvals">
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="mb-3 h-5 w-40" />
      <SkeletonList rows={4} />
    </div>
  );
}
