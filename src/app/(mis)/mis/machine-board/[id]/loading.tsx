import { Skeleton, SkeletonDetail } from '@/components/mis/kit/skeleton';

/** Detail loading: title bar then two cards, matching the real layout. */
export default function DetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <SkeletonDetail />
    </div>
  );
}
