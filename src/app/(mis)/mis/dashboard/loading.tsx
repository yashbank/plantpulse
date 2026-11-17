import { Skeleton } from '@/components/mis/kit';

/** Mirrors the real dashboard: greeting, range tabs, then the card grid (1 col phone, 4 col laptop). */
export default function Loading() {
  const spans = ['', '', '', '', 'lg:col-span-3 lg:row-span-2', '', 'lg:col-span-2', 'lg:col-span-2'];
  return (
    <div className="p-4 lg:p-6" role="status" aria-live="polite" aria-label="Loading dashboard">
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="mt-2 h-4 w-40 max-w-full" />
      <Skeleton className="mt-4 h-11 w-full max-w-md" />
      <div className="mt-4 flex justify-end">
        <Skeleton className="h-11 w-28" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {spans.map((span, i) => (
          <div key={i} className={`flex min-h-[132px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 ${span}`}>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="mt-auto h-7 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
