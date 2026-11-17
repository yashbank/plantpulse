'use client';

import Link from 'next/link';

import { Lock } from 'lucide-react';

import { useT } from './shell/locale-provider';

/**
 * The friendly "you may not" screen.
 *
 * Rendered directly by a server component that has already established the user
 * lacks permission, so it does not depend on a thrown error surviving Next's
 * production error sanitisation.
 */
export function Forbidden() {
  const t = useT();

  return (
    <div className="mis-rise mx-auto my-8 flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <Lock className="size-7" aria-hidden="true" />
      </span>
      <h1 className="text-lg font-semibold text-slate-900">{t('error.forbidden.title')}</h1>
      <p className="text-base text-slate-600">{t('error.forbidden.body')}</p>
      <Link
        href="/mis"
        className="mis-press mis-sheen mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-base font-semibold text-white hover:bg-indigo-700"
      >
        {t('error.backHome')}
      </Link>
    </div>
  );
}
