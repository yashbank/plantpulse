import { Skeleton } from '@/components/mis/kit';

/** Mirrors the parked-writes inbox: title, then stacked write cards. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl p-6" role="status" aria-live="polite" aria-label="Loading parked writes">
      <Skeleton className="mb-4 h-8 w-48" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
