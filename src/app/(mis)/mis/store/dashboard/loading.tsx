import { Skeleton, SkeletonList } from '@/components/mis/kit/skeleton';

/** Shown while the store overview resolves: header, four stat cards, then recent activity rows. */
export default function StoreDashboardLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Skeleton className="h-11 w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <SkeletonList rows={5} />
    </div>
  );
}
