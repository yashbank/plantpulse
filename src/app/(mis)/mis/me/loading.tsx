import { Skeleton, SkeletonForm } from '@/components/mis/kit';

/** Mirrors the my-account screens: title, then form cards in the phone column. */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-3 pb-24 md:max-w-3xl" role="status" aria-live="polite" aria-label="Loading">
      <Skeleton className="h-8 w-44" />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <SkeletonForm fields={3} />
      </div>
    </div>
  );
}
