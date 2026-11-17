import { cn } from '@/lib/utils';

/**
 * Loading placeholder.
 *
 * A factory connection is often one bar of 3G; a blank frame reads as "broken"
 * where a shimmer reads as "coming". The sweep is a transform on a pseudo-element
 * (`.mis-skeleton`, globals.css), so it never repaints the bar and stops under
 * prefers-reduced-motion, leaving the static fill.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('mis-skeleton rounded-md', className)} />;
}

/** The list shape most MIS screens fall back to while loading. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-live="polite">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

/** Table-shaped placeholder: a header strip then `rows` rows of `cols` cells. */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-live="polite">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** KPI grid placeholder: `count` cards, each a label bar (h-3 w-20) over a value bar (h-9 w-28). */
export function SkeletonKpi({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)} role="status" aria-live="polite">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      ))}
    </div>
  );
}

/** Detail screen placeholder: a title bar then two cards. */
export function SkeletonDetail({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4', className)} role="status" aria-live="polite">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

/** Form placeholder: `fields` label/input pairs (label h-3, input h-12 = the 48px input height). */
export function SkeletonForm({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4', className)} role="status" aria-live="polite">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
