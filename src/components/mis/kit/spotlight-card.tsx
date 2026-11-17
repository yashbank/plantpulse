'use client';

// Adapted from React Bits (https://reactbits.dev) - MIT + Commons Clause, (c) 2026 David Haz

import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type SpotlightCardProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & { children: ReactNode };

/**
 * A card with a soft indigo glow that follows a mouse pointer. Pointer devices only: touch and
 * pen input never set the position, and the glow itself exists only under `@media (hover:hover)`.
 * No React state: the pointer position is written to CSS variables, the glow is an opacity fade.
 * Styled as the raised 16px card; pass className to change it. Use for KPI / summary tiles.
 */
export function SpotlightCard({ children, className, onPointerMove, onPointerLeave, ...rest }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
    el.setAttribute('data-spot', '');
  };
  const leave = (e: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    ref.current?.removeAttribute('data-spot');
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cn('mis-spot rounded-2xl border border-slate-200 bg-white p-4 shadow-card', className)}
      {...rest}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
