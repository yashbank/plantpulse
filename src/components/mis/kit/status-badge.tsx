import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'good' | 'warning' | 'critical' | 'info';
export type BadgeModule = 'production' | 'quality' | 'store' | 'people' | 'purchasing';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  good: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  critical: 'bg-red-50 text-red-800 ring-red-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
};

const DOTS: Record<BadgeTone, string> = {
  neutral: 'bg-slate-400',
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
  info: 'bg-sky-500',
};

/** Module chip: tinted bg + accent dot, text stays slate-900 (design-spec 2). Never carries state. */
const MODULES: Record<BadgeModule, { chip: string; dot: string }> = {
  production: { chip: 'bg-indigo-100 ring-indigo-200', dot: 'bg-indigo-500' },
  quality: { chip: 'bg-emerald-100 ring-emerald-200', dot: 'bg-emerald-500' },
  store: { chip: 'bg-amber-100 ring-amber-200', dot: 'bg-amber-500' },
  people: { chip: 'bg-sky-100 ring-sky-200', dot: 'bg-sky-500' },
  purchasing: { chip: 'bg-violet-100 ring-violet-200', dot: 'bg-violet-500' },
};

/**
 * A status pill.
 *
 * The label is always rendered — colour never carries meaning on its own,
 * because a red/green pair is invisible to a colourblind supervisor and to
 * anyone printing a job card in black and white.
 *
 * `dot` adds a 6px leading dot in the tone colour. `module` turns the pill into a module chip
 * (accent dot, slate text); it replaces the tone colours and always shows its dot.
 */
export function StatusBadge({
  tone = 'neutral',
  children,
  className,
  dot = false,
  module,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  module?: BadgeModule;
}) {
  const mod = module ? MODULES[module] : null;
  const showDot = dot || mod !== null;
  return (
    <span
      className={cn(
        'mis-badge inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset',
        mod ? `${mod.chip} text-slate-900` : TONES[tone],
        showDot && 'gap-1.5',
        className,
      )}
    >
      {showDot && (
        <span aria-hidden="true" data-badge-dot="" className={cn('size-1.5 shrink-0 rounded-full', mod ? mod.dot : DOTS[tone])} />
      )}
      {children}
    </span>
  );
}
