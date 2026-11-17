'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export type TabItem = { id: string; label: string };

/**
 * Underline tab strip, 44px targets, scrolls sideways on a phone. The caller renders the panel (role=tabpanel, aria-labelledby=`tab-<id>`).
 * The active underline is one 2px bar that slides with `transform` (translateX + scaleX, 180ms);
 * until it is measured (first paint / no layout) the active tab draws its own underline instead.
 */
export function Tabs({ tabs, active, onChange, label }: { tabs: TabItem[]; active: string; onChange: (id: string) => void; label: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!el || el.offsetWidth === 0) return setBar(null);
      setBar((b) => (b && b.x === el.offsetLeft && b.w === el.offsetWidth ? b : { x: el.offsetLeft, w: el.offsetWidth }));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, tabs]);

  return (
    <div ref={listRef} role="tablist" aria-label={label} className="relative flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          role="tab"
          type="button"
          aria-selected={t.id === active}
          onClick={() => onChange(t.id)}
          className={cn(
            'mis-tab mis-press min-h-11 shrink-0 border-b-2 px-4 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-600',
            t.id === active ? 'text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900',
            t.id === active && !bar && 'border-indigo-600',
            t.id === active && bar && 'border-transparent',
          )}
        >
          {t.label}
        </button>
      ))}
      {bar && (
        <span
          aria-hidden="true"
          data-tab-indicator=""
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-px origin-left bg-indigo-600 transition-transform duration-[180ms] ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${bar.x}px) scaleX(${bar.w})` }}
        />
      )}
    </div>
  );
}
