import type { ReactNode } from 'react';

/**
 * What a screen shows when there is nothing to show.
 *
 * Strings arrive already translated — this component holds no English.
 */
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  /** Optional 20px decorative icon (already an element); drawn slate-300 above the title. */
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      {icon && (
        <span aria-hidden="true" className="mb-1 flex size-5 items-center justify-center text-slate-300 [&>svg]:size-5">
          {icon}
        </span>
      )}
      <p className="text-base font-medium text-slate-900">{title}</p>
      {body && <p className="max-w-sm text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
