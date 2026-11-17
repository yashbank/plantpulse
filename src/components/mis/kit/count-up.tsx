'use client';

// Adapted from React Bits (https://reactbits.dev) - MIT + Commons Clause, (c) 2026 David Haz

import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export type CountUpProps = {
  value: number;
  /** Milliseconds. Default 800. */
  duration?: number;
  decimals?: number;
  /** Custom formatter (currency, units). Default: en-IN grouping with `decimals` places. */
  format?: (n: number) => string;
  className?: string;
};

function defaultFormat(n: number, decimals: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * A KPI number that counts up with requestAnimationFrame (no animation library).
 * The server render and the first client render both show the FINAL value, so there is no
 * hydration mismatch and no-JS / SSR readers see the real number. Under prefers-reduced-motion
 * (or where matchMedia is missing) it never animates. It animates on mount and whenever `value`
 * changes, from the value currently shown. Always `tabular-nums`.
 */
export function CountUp({ value, duration = 800, decimals = 0, format, className }: CountUpProps) {
  const fmt = (n: number) => (format ? format(n) : defaultFormat(n, decimals));
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const first = useRef(true);

  useLayoutEffect(() => {
    const reduce =
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = first.current ? 0 : shownRef.current;
    first.current = false;
    if (reduce || duration <= 0 || from === value) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = t === 1 ? value : from + (value - from) * eased;
      shownRef.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    shownRef.current = from;
    setShown(from);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={cn('tabular-nums', className)}>{fmt(shown)}</span>;
}
