import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type Crumb = { label: string; href?: string };

export type PageHeaderProps = {
  /** Already translated. Rendered as the screen's single <h1>. */
  title: string;
  /** Trail shown from `lg` up. The last item is the current page (no link needed). */
  breadcrumbs?: Crumb[];
  /** Phone back arrow target. Defaults to the nearest linked breadcrumb. No target, no arrow. */
  backHref?: string;
  /** Accessible name of the back arrow (already translated). Defaults to the parent crumb's label. */
  backLabel?: string;
  /** aria-label of the breadcrumb nav (already translated). */
  breadcrumbLabel?: string;
  /** One line under the title: counts, dates, a StatusBadge. */
  meta?: ReactNode;
  /** Right-aligned: at most one primary Button plus an overflow menu. */
  actions?: ReactNode;
  /** Brand-gradient title. At most one per screen. */
  gradient?: boolean;
  className?: string;
};

/**
 * The one page header: breadcrumbs (>= lg) or a back arrow (phone), title, meta, actions.
 * Not sticky: wrap it yourself if a screen needs that (the phone top bar is already sticky).
 */
export function PageHeader({
  title,
  breadcrumbs,
  backHref,
  backLabel,
  breadcrumbLabel = 'Breadcrumb',
  meta,
  actions,
  gradient = false,
  className,
}: PageHeaderProps) {
  const parent = breadcrumbs ? [...breadcrumbs].reverse().find((c) => c.href) : undefined;
  const href = backHref ?? parent?.href;
  const backName = backLabel ?? parent?.label;

  return (
    <header className={cn('mb-4 flex flex-col gap-1 md:mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label={breadcrumbLabel} className="hidden text-xs text-slate-500 lg:block">
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumbs.map((c, i) => (
              <li key={`${i}-${c.label}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight aria-hidden="true" className="size-3 text-slate-400" />}
                {c.href && i < breadcrumbs.length - 1 ? (
                  <Link href={c.href} className="rounded-md hover:text-slate-900 hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current={i === breadcrumbs.length - 1 ? 'page' : undefined}>{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex items-center gap-2">
        {href && (
          <Link
            href={href}
            aria-label={backName}
            className="mis-press -ml-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>
        )}
        <h1
          className={cn(
            'min-w-0 flex-1 break-words text-2xl font-bold tracking-tight text-slate-900',
            gradient && 'mis-gradient-text',
          )}
        >
          {title}
        </h1>
        {actions && <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>
      {meta && <div className="text-sm text-slate-600">{meta}</div>}
    </header>
  );
}
