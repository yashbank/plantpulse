'use client';

import Link from 'next/link';
import { EllipsisVertical } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { FixedMenu } from '@/components/ui/fixed-menu';
import { cn } from '@/lib/utils';

export type RowActionItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  /** Navigates (rendered as a link). Provide this OR onSelect. */
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type Props = {
  items: RowActionItem[];
  /** Accessible name of the three-dot trigger. Default "More actions". */
  label?: string;
  className?: string;
};

const ITEM =
  'mis-menu-item group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-slate-700 outline-none touch-manipulation transition-colors duration-150 active:bg-indigo-100 hover:bg-indigo-50 hover:text-indigo-900 focus-visible:bg-indigo-50 focus-visible:text-indigo-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent';
const ITEM_DANGER = 'text-red-700 hover:bg-red-50 hover:text-red-800 focus-visible:bg-red-50 focus-visible:text-red-800';

/**
 * Three-dot row menu: secondary actions live here so a table row shows one prominent action at most.
 * The trigger is a 44px button with an accessible name; the menu opens in a portal (FixedMenu), so a
 * table's overflow never clips it. Arrow keys move between items, Escape closes and returns focus.
 * Motion is CSS only and is switched off by prefers-reduced-motion (see globals.css .mis-menu-*).
 */
export function RowActions({ items, label = 'More actions', className }: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const first = listRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])');
    first?.focus();
  }, [open]);

  if (items.length === 0) return null;

  const move = (dir: 1 | -1) => {
    const nodes = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
    if (nodes.length === 0) return;
    const at = nodes.indexOf(document.activeElement as HTMLElement);
    nodes[(at + dir + nodes.length) % nodes.length]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); anchorRef.current?.focus(); }
    else if (e.key === 'Tab') close();
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn('mis-row-trigger', open && 'is-open', className)}
      >
        <EllipsisVertical aria-hidden="true" className="size-5" />
      </button>
      <FixedMenu open={open} onClose={close} anchorRef={anchorRef} width={208} estimatedHeight={items.length * 44 + 8}>
        <div id={menuId} ref={listRef} onKeyDown={onKeyDown} className="mis-menu-list flex flex-col gap-0.5">
          {items.map((it, i) => {
            const cls = cn(ITEM, it.danger && ITEM_DANGER);
            const style = { animationDelay: `${i * 28}ms` };
            const inner = (
              <>
                {it.icon && <span aria-hidden="true" className="mis-menu-icon text-slate-400 transition-colors group-hover:text-current group-focus-visible:text-current">{it.icon}</span>}
                <span>{it.label}</span>
              </>
            );
            if (it.href) {
              return (
                <Link key={it.key} href={it.href} role="menuitem" onClick={close} className={cls} style={style}>
                  {inner}
                </Link>
              );
            }
            return (
              <button
                key={it.key}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                onClick={() => { close(); it.onSelect?.(); }}
                className={cls}
                style={style}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </FixedMenu>
    </>
  );
}
