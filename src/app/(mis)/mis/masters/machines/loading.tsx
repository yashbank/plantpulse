import { Skeleton, SkeletonList, SkeletonTable } from '@/components/mis/kit/skeleton';

/** Masters list loading: header, search, then rows (cards on a phone, table from md up). */
export default function MasterListLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
      <div className="md:hidden">
        <SkeletonList rows={4} />
      </div>
      <div className="hidden md:block">
        <SkeletonTable rows={5} />
      </div>
    </div>
  );
}
