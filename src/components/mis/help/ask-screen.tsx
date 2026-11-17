'use client';

import Link from 'next/link';
import { useCallback, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Send } from 'lucide-react';

import { askHelpAction } from '@/app/(mis)/mis/help/actions';
import { Button, Card, EmptyState, Input, PageHeader, Skeleton, StatusBadge } from '@/components/mis/kit';
import { useT } from '@/components/mis/shell/locale-provider';
import type { HelpAnswer, HelpMedia } from '@/lib/mis/help/types';
import type { MisRoleName } from '@/lib/mis/roles';

const MAX_LEN = 200;
const ACTION_VERBS = new Set(['open', 'tap', 'click', 'press', 'select', 'choose', 'enter', 'type', 'check', 'add', 'save', 'confirm', 'go', 'pick', 'scroll', 'search', 'find', 'review', 'approve', 'start', 'stop', 'fill']);
const RECENT_KEY = 'mis.help.recent';
const RECENT_MAX = 5;

type Chip = { id: string; title: string };

type View =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'answer'; answer: HelpAnswer }
  | { kind: 'rate_limited'; message: string }
  | { kind: 'error'; message: string };

const listeners = new Set<() => void>();
function subscribeRecent(cb: () => void) {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}
/** Raw JSON string: a stable snapshot for useSyncExternalStore. */
function rawRecent(): string {
  try {
    return window.sessionStorage.getItem(RECENT_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}
function parseRecent(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}
function pushRecent(q: string) {
  const next = [q, ...parseRecent(rawRecent()).filter((p) => p !== q)].slice(0, RECENT_MAX);
  try {
    window.sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: recent questions are a convenience only */
  }
  listeners.forEach((l) => l());
}

const CHIP =
  'mis-press inline-flex min-h-11 max-w-full items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600';

export function AskScreen({ role: _role, suggestions }: { role: MisRoleName | null; suggestions: Chip[] }) {
  const t = useT();
  const inputId = useId();
  const [question, setQuestion] = useState('');
  const [view, setView] = useState<View>({ kind: 'idle' });
  const recentRaw = useSyncExternalStore(subscribeRecent, rawRecent, () => '[]');
  const recent = useMemo(() => parseRecent(recentRaw), [recentRaw]);
  const [hint, setHint] = useState<string | null>(null);
  const seq = useRef(0);

  const ask = useCallback(
    async (raw: string) => {
      const q = raw.trim().slice(0, MAX_LEN);
      if (!q) {
        setHint(t('help.empty'));
        return;
      }
      setHint(null);
      setQuestion(q);
      const mine = ++seq.current;
      setView({ kind: 'loading' });
      try {
        const result = await askHelpAction(q);
        if (mine !== seq.current) return;
        if (result.ok) {
          setView({ kind: 'answer', answer: result.answer });
          pushRecent(q);
        } else if (result.reason === 'rate_limited') {
          setView({ kind: 'rate_limited', message: result.message });
        } else if (result.reason === 'empty') {
          setView({ kind: 'idle' });
          setHint(t('help.empty'));
        } else {
          setView({ kind: 'error', message: result.message });
        }
      } catch {
        if (mine === seq.current) setView({ kind: 'error', message: t('help.error') });
      }
    },
    [t],
  );

  const loading = view.kind === 'loading';

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-5 pb-24 md:max-w-3xl">
      <PageHeader title={t('help.title')} meta={<span>{t('help.subtitle')}</span>} />

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <div className="min-w-0 flex-1">
          <Input
            id={inputId}
            label={t('help.label')}
            value={question}
            maxLength={MAX_LEN}
            placeholder={t('help.placeholder')}
            autoComplete="off"
            enterKeyHint="send"
            error={hint}
            hint={`${question.length}/${MAX_LEN}`}
            onChange={(e) => setQuestion(e.target.value.slice(0, MAX_LEN))}
          />
        </div>
        <Button type="submit" loading={loading} aria-label={t('help.send')} className="mb-[1px] h-12 shrink-0 gap-2 px-4">
          <Send aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">{t('help.send')}</span>
        </Button>
      </form>

      {suggestions.length > 0 && (
        <section aria-label={t('help.suggested')}>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">{t('help.suggested')}</h2>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((c) => (
              <li key={c.id} className="max-w-full">
                <button type="button" className={CHIP} onClick={() => void ask(c.title)}>
                  {c.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div aria-live="polite" aria-atomic="false" className="min-w-0">
        {view.kind === 'loading' && (
          <Card raised>
            <p className="mb-3 text-sm font-medium text-slate-700">{t('help.thinking')}</p>
            <div aria-hidden="true" className="flex flex-col gap-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </Card>
        )}
        {view.kind === 'answer' && <AnswerCard answer={view.answer} onAsk={(q) => void ask(q)} />}
        {view.kind === 'rate_limited' && (
          <Card tone="warning" className="mis-rise p-4">
            <StatusBadge tone="warning" dot>
              {t('help.rateLimited')}
            </StatusBadge>
            {view.message && <p className="mt-2 text-sm text-amber-900">{view.message}</p>}
          </Card>
        )}
        {view.kind === 'error' && (
          <Card tone="danger" className="mis-rise p-4">
            <p className="font-semibold text-red-800">{t('help.error')}</p>
            {view.message && <p className="mt-1 text-sm text-red-800">{view.message}</p>}
            <div className="mt-3">
              <Button variant="secondary" onClick={() => void ask(question)}>
                {t('help.send')}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {recent.length > 0 && (
        <section aria-label={t('help.recent')}>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">{t('help.recent')}</h2>
          <ul className="flex flex-wrap gap-2">
            {recent.map((q) => (
              <li key={q} className="max-w-full">
                <button type="button" className={CHIP} onClick={() => void ask(q)}>
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function AnswerCard({ answer, onAsk }: { answer: HelpAnswer; onAsk: (q: string) => void }) {
  const t = useT();

  if (answer.source === 'none') {
    return (
      <div className="mis-rise">
        <EmptyState title={t('help.noneTitle')} body={answer.summary || t('help.noneBody')} />
        <Related items={answer.related} onAsk={onAsk} />
      </div>
    );
  }

  const tone = answer.allowed === true ? 'good' : answer.allowed === false ? 'warning' : 'neutral';
  const badge = answer.allowed === true ? t('help.can') : answer.allowed === false ? t('help.cannot') : t('help.answer');

  return (
    <Card raised tone={tone === 'neutral' ? undefined : tone} className="mis-rise flex flex-col gap-4 p-4">
      <div className="flex flex-col items-start gap-2">
        <StatusBadge tone={tone} dot>
          {badge}
        </StatusBadge>
        <h2 className="text-lg font-semibold text-slate-900">{answer.title}</h2>
        {answer.summary && <p className="text-sm text-slate-700">{answer.summary}</p>}
      </div>

      {answer.steps.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-slate-600 uppercase">{t('help.steps')}</h3>
          <ol className="mis-ask-steps list-none">
            {answer.steps.map((step, i) => {
              const [verb, ...rest] = step.split(' ');
              return (
                <li key={i} className="mis-ask-step text-base text-slate-900">
                  <span aria-hidden="true" className="mis-ask-num">
                    {i + 1}
                  </span>
                  <span className="min-w-0 pt-1 leading-snug break-words">
                    {ACTION_VERBS.has(verb.toLowerCase()) ? <strong className="font-semibold text-indigo-800">{verb}</strong> : verb}
                    {rest.length > 0 ? ` ${rest.join(' ')}` : ''}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {answer.media && answer.media.length > 0 && (
        <div className="flex flex-col gap-3">
          {answer.media.map((m, i) => (
            <MediaBlock key={i} media={m} />
          ))}
        </div>
      )}

      {answer.allowed !== false && answer.href && (
        <Link
          href={answer.href}
          className="mis-sheen mis-ripple-fill inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:self-start"
        >
          {t('help.open')}
        </Link>
      )}

      <Related items={answer.related} onAsk={onAsk} />
    </Card>
  );
}

function Related({ items, onAsk }: { items: { id: string; title: string }[]; onAsk: (q: string) => void }) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <section aria-label={t('help.related')} className="mt-1">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{t('help.related')}</h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((r) => (
          <li key={r.id} className="max-w-full">
            <button type="button" className={CHIP} onClick={() => onAsk(r.title)}>
              {r.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MediaBlock({ media }: { media: HelpMedia }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const frame = 'w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50';

  if (media.kind === 'video') {
    const src = Array.isArray(media.src) ? media.src[0] : media.src;
    if (!src) return null;
    return (
      <figure className={frame}>
        <video controls preload="metadata" aria-label={media.alt} className="block h-auto w-full" src={src} />
        <figcaption className="px-3 py-2 text-xs text-slate-600">{media.alt}</figcaption>
      </figure>
    );
  }

  if (media.kind === 'slides') {
    const list = Array.isArray(media.src) ? media.src : [media.src];
    if (list.length === 0) return null;
    const last = list.length - 1;
    const i = Math.min(index, last);
    return (
      <figure className={frame} aria-roledescription="carousel" aria-label={media.alt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={list[i]} alt={`${media.alt} (${t('help.slide')} ${i + 1} ${t('help.of')} ${list.length})`} loading="lazy" decoding="async" className="block h-auto w-full" />
        {list.length > 1 && (
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-2">
            <Button variant="secondary" disabled={i === 0} onClick={() => setIndex(i - 1)}>
              {t('help.prev')}
            </Button>
            <span className="text-xs text-slate-600">
              {i + 1} {t('help.of')} {list.length}
            </span>
            <Button variant="secondary" disabled={i === last} onClick={() => setIndex(i + 1)}>
              {t('help.next')}
            </Button>
          </div>
        )}
      </figure>
    );
  }

  const src = Array.isArray(media.src) ? media.src[0] : media.src;
  if (!src) return null;
  return (
    <figure className={frame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={media.alt} loading="lazy" decoding="async" className="block h-auto w-full" />
    </figure>
  );
}
