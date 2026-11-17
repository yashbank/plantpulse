import { Skeleton, SkeletonTable } from '@/components/mis/kit/skeleton';

/** Shown while the register resolves: header, view links, date bar, search, then table rows. */
export default function AttendanceLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-24 rounded-lg" />
        <Skeleton className="h-11 w-36 rounded-lg" />
        <Skeleton className="h-11 w-32 rounded-lg" />
      </div>
      <Skeleton className="h-12 w-full max-w-sm rounded-lg" />
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
