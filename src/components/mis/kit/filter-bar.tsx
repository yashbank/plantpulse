'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { SearchInput } from './search-input';

export type FilterBarProps = {
  searchLabel: string;
  query: string;
  onQuery: (q: string) => void;
  /** Dropdowns / chips, already rendered by the caller. */
  children?: ReactNode;
  /** Stick under the header while the list scrolls (`bg-white/95`, no blur). Off by default. */
  sticky?: boolean;
  /** Already-translated result count, announced politely when it changes. */
  resultCount?: ReactNode;
  className?: string;
};

/** Shared list toolbar: debounced search on the left, filters wrapping beside it. T2 builds every list on this. */
export function FilterBar({ searchLabel, query, onQuery, children, sticky = false, resultCount, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end',
        sticky && 'mis-filterbar sticky top-12 z-20 -mx-4 border-b border-slate-200 bg-white/95 px-4 py-3 lg:top-0 lg:mx-0 lg:rounded-xl lg:border lg:px-3',
        className,
      )}
    >
      <div className="min-w-0 sm:max-w-sm sm:flex-1">
        <SearchInput label={searchLabel} value={query} onSearch={onQuery} />
      </div>
      {children}
      {resultCount !== undefined && (
        <p aria-live="polite" className="text-sm text-slate-600 sm:ml-auto">
          {resultCount}
        </p>
      )}
    </div>
  );
}
