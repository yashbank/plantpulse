import { cn } from '@/lib/utils';

export type CardTone = 'neutral' | 'action' | 'warning' | 'danger' | 'good' | 'money' | 'hero';

/** Tone recipes: MIS_UI_SPEC 4.2 (`bg-X-50 border-X-200`). `neutral` is the original look. */
const TONES: Record<CardTone, string> = {
  neutral: 'border-slate-200 bg-white',
  action: 'border-indigo-200 bg-indigo-50',
  warning: 'border-amber-200 bg-amber-50',
  danger: 'border-red-200 bg-red-50',
  good: 'border-emerald-200 bg-emerald-50',
  // OWNER-only values: the caller must not render a money card for anyone else.
  money: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  // ONE per screen: the card that unblocks work.
  hero: 'border-transparent bg-linear-to-br from-indigo-600 to-indigo-800 text-white shadow-float',
};

/**
 * The mobile stand-in for a table row.
 *
 * At 360px a table becomes a stack of these rather than a horizontal scroll —
 * sideways scrolling on a phone hides columns people need.
 *
 * Defaults are unchanged (`neutral`, flat, 12px radius). `tone` / `raised` opt in to the premium
 * recipe (16px radius; hero 20px); `interactive` forces the lift + press feedback on a card that
 * is not itself a button (e.g. wraps a link). A card with `onClick` is interactive automatically (press feedback only; pass `interactive` explicitly to add the hover lift).
 */
export function Card({
  children,
  className,
  onClick,
  tone = 'neutral',
  raised = false,
  interactive: interactiveProp,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  tone?: CardTone;
  /** Soft layered shadow (shadow-1) and the 16px card radius. */
  raised?: boolean;
  interactive?: boolean;
}) {
  const clickable = typeof onClick === 'function';
  const interactive = interactiveProp ?? clickable;
  const Tag = clickable ? 'button' : 'div';
  const premium = raised || tone !== 'neutral';

  return (
    <Tag
      type={clickable ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'mis-card w-full border p-4 text-left',
        premium ? (tone === 'hero' ? 'rounded-[1.25rem]' : 'rounded-2xl') : 'rounded-xl',
        TONES[tone],
        raised && tone !== 'hero' && 'shadow-card',
        interactive &&
          'mis-press min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900',
        // Hover lift only when asked for (`interactive` passed explicitly); a plain onClick card keeps its old hover.
        interactiveProp === true && 'mis-lift',
        interactive && tone === 'neutral' && 'transition-colors hover:bg-slate-50',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-base text-slate-900">{value}</span>
    </div>
  );
}
