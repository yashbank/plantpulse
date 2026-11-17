import { Skeleton, SkeletonDetail } from '@/components/mis/kit/skeleton';

/** Traceability loading: header, order search, then the trace cards. */
export default function TraceabilityLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <SkeletonDetail />
    </div>
  );
}
