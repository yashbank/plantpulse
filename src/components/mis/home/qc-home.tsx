'use client';

import Link from 'next/link';

import { Card } from '@/components/mis/kit/card';
import { cn } from '@/lib/utils';

import {
  AlertRow,
  EmptyNote,
  FailCard,
  HeaderCard,
  HomeStack,
  InfoCard,
  Mono,
  OkCard,
  RowLink,
  SectionLabel,
} from './cards';

export type QcSlotView = {
  hour: number;
  label: string;
  state: 'pass' | 'fail' | 'makeready' | 'never';
};

export type QcHomeProps = {
  header: { title: string; meta: string };
  due: { label: string; minutesAway: number } | null;
  slots: QcSlotView[];
  failures: {
    id: string;
    orderId: string;
    orderNumber: string;
    parameterName: string;
    detail: string;
  }[];
  alsoToday: {
    id: string;
    orderId: string;
    orderNumber: string;
    parameterName: string;
    result: string;
    time: string;
  }[];
};

/**
 * Dashed = never checked. Grey = checked and not applicable.
 *
 * Those two must never look alike: one is a gap in the record, the other is a
 * record. The legend spells both out in words rather than relying on colour.
 */
const SLOT_STYLES: Record<QcSlotView['state'], string> = {
  pass: 'border border-green-200 bg-green-50 text-green-700',
  fail: 'border border-red-200 bg-red-50 text-red-700',
  makeready: 'border border-slate-200 bg-slate-100 text-slate-500',
  never: 'border-2 border-dashed border-slate-300 bg-white text-slate-400',
};

export function QcHome({ header, due, slots, failures, alsoToday }: QcHomeProps) {
  return (
    <HomeStack>
      <HeaderCard title={header.title} meta={header.meta} />

      {due ? (
        // The one hero card on this screen.
        <Card tone="hero" className="mis-rise p-5">
          <SectionLabel>
            <span className="text-indigo-100">Next check</span>
          </SectionLabel>
          <p className="mt-1 text-xl font-bold text-white">
            {due.label} check{' '}
            {due.minutesAway > 0
              ? `due in ${due.minutesAway} min`
              : due.minutesAway === 0
                ? 'due now'
                : `overdue by ${Math.abs(due.minutesAway)} min`}
          </p>
          <Link
            href="/mis/qc"
            className="mis-press mis-ripple mt-3 flex min-h-14 w-full touch-manipulation items-center justify-center rounded-xl bg-white px-4 text-center text-lg font-bold text-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Start the {due.label} check
          </Link>
        </Card>
      ) : (
        <OkCard className="mis-rise">
          <SectionLabel>Next check</SectionLabel>
          <p className="mt-1 font-semibold text-slate-900">
            Every slot in today’s round has been recorded.
          </p>
        </OkCard>
      )}

      <InfoCard className="mis-rise">
        <SectionLabel>Today’s hourly checks</SectionLabel>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {slots.map((slot) => (
            <Link
              key={slot.hour}
              href="/mis/qc/grid"
              className={cn(
                'mis-press flex min-h-16 touch-manipulation flex-col items-center justify-center rounded-xl text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
                SLOT_STYLES[slot.state],
              )}
            >
              {slot.label}
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide">
                {slot.state === 'never'
                  ? 'not yet'
                  : slot.state === 'makeready'
                    ? 'make-ready'
                    : slot.state}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span>Green — passed</span>
          <span>Red — failed</span>
          <span>Grey — make-ready, nothing to judge</span>
          <span>Dashed — never checked</span>
        </div>
      </InfoCard>

      {failures.length > 0 && (
        <FailCard className="mis-rise">
          <SectionLabel>Failed today</SectionLabel>
          <div className="mt-1">
            {failures.map((f) => (
              <AlertRow
                key={f.id}
                tone="stopped"
                title={`${f.orderNumber} · ${f.parameterName}`}
                detail={f.detail}
                href={`/mis/qc/${f.orderId}`}
              />
            ))}
          </div>
        </FailCard>
      )}

      <InfoCard>
        <SectionLabel>Also today</SectionLabel>
        <div className="mt-1">
          {alsoToday.length === 0 ? (
            <EmptyNote>No checks recorded today.</EmptyNote>
          ) : (
            alsoToday.map((c) => (
              <RowLink
                key={c.id}
                href={`/mis/qc/${c.orderId}`}
                title={
                  <>
                    {c.parameterName} <Mono>{c.orderNumber}</Mono>
                  </>
                }
                detail={`${c.result} · ${c.time}`}
              />
            ))
          )}
        </div>
      </InfoCard>
    </HomeStack>
  );
}
