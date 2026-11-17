'use client';

import Link from 'next/link';
import { Lock, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/mis/kit/button';
import { useT } from '@/components/mis/shell/locale-provider';

/**
 * The MIS error boundary.
 *
 * When the server says no, the user sees something calm and readable instead of
 * a stack trace or a blank screen.
 *
 * Caveat worth knowing: Next sanitises server error messages AND the subclass name in
 * production, so `error.name` alone is only reliable in development — `MisForbiddenError` sets
 * `digest` to a fixed fingerprint specifically because `digest` is the one property Next carries
 * across untouched, and that is what this boundary actually keys off. Server modules that want a
 * guaranteed forbidden screen can still render <Forbidden/> directly instead of throwing.
 */
export default function MisError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  const forbidden = error.name === 'MisForbiddenError' || error.digest === 'MIS_FORBIDDEN';

  useEffect(() => {
    console.error('[mis] boundary caught', error);
  }, [error]);

  const Icon = forbidden ? Lock : TriangleAlert;

  return (
    <div className="mis-rise mx-auto my-8 flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <span
        className={`flex size-14 items-center justify-center rounded-2xl ${forbidden ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}
      >
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold text-slate-900">
        {forbidden ? t('error.forbidden.title') : t('error.title')}
      </h1>
      {forbidden && <p className="text-base text-slate-600">{t('error.forbidden.body')}</p>}

      <div className="mt-3 flex w-full flex-col gap-2">
        <Link
          href="/mis"
          className="mis-press mis-sheen inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-base font-semibold text-white hover:bg-indigo-700"
        >
          {t('error.backHome')}
        </Link>
        {!forbidden && (
          <Button variant="secondary" block onClick={reset}>
            {t('action.retry')}
          </Button>
        )}
      </div>
    </div>
  );
}
