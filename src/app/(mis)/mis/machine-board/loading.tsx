import { Skeleton, SkeletonKpi, SkeletonList } from '@/components/mis/kit/skeleton';

/** Machine board loading: header, free/running/down tiles, then machine cards. */
export default function MachineBoardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <SkeletonKpi count={3} />
      <SkeletonList rows={3} />
    </div>
  );
}
