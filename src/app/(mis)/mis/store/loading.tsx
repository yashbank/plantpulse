import { Skeleton, SkeletonTable } from '@/components/mis/kit/skeleton';

/** Fallback for store screens without their own loading state: page header, filter bar, then table rows. */
export default function StoreLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-12 w-full max-w-sm" />
      <SkeletonTable />
    </div>
  );
}
