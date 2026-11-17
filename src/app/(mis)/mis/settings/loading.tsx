import { Skeleton, SkeletonList } from '@/components/mis/kit';

/** Mirrors the settings screens: title and a line of meta, then rule cards. */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4" role="status" aria-live="polite" aria-label="Loading settings">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-md" />
      <SkeletonList rows={5} />
    </div>
  );
}
