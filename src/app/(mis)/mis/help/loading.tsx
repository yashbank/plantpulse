import { Skeleton } from '@/components/mis/kit';

/** Mirrors the Ask screen: title, input row, a row of chips. */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4 pb-24 md:max-w-3xl" role="status" aria-live="polite" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-12 w-full" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-36 rounded-full" />
        ))}
      </div>
    </div>
  );
}
