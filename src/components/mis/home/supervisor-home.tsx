'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import { clearLineAction } from '@/app/(mis)/mis/production/actions';
import { Card } from '@/components/mis/kit/card';
import { cn } from '@/lib/utils';
import { PendingSyncNote } from '@/components/mis/shell/pending-sync-note';

import {
  BigStat,
  Chip,
  EmptyNote,
  HeaderCard,
  HomeStack,
  InfoCard,
  Mono,
  RowLink,
  SectionLabel,
  StatTrio,
  WarnCard,
} from './cards';

export type SupervisorHomeProps = {
  header: { title: string; meta: string };
  clearanceBlocker: {
    machineId: string;
    machineName: string;
    orderId: string;
    orderNumber: string;
  } | null;
  blocker: {
    orderId: string;
    orderNumber: string;
    parameterName: string;
    defectType: string | null;
    since: string;
  } | null;
  machines: { free: number; running: number; down: number; total: number };
  /**
   * Phases this person is the in-charge of and has not signed (MIS-164). Until
   * Phase 7 this card showed attendance clock-out approvals, which are a
   * different thing that happened to fit the same slot.
   */
  signOff: {
    total: number;
    rows: { id: string; processName: string; orderNumber: string; detail: string }[];
  };
  crew: {
    present: number;
    headcount: number;
    absent: number;
    onLeave: number;
    recorded: boolean;
    /** R3 B100: on a machine now / clocked in with no machine / live bookings with nobody on them. */
    onMachines: number;
    free: number;
    unstaffedBookings: number;
  };
};

/**
 * The supervisor home.
 *
 * Recording production is the single thing this person does most, so it is a
 * button at the top rather than a tab two taps away — everything below it is
 * there to answer "what is stopping me".
 */
/** Premium quiet link-button: 48px+ target, press tint, same recipe as the kit secondary Button. */
const QUIET_LINK =
  'mis-press mis-ripple flex min-h-14 w-full touch-manipulation items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-center text-base font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';
/** The quiet button inside an amber/warning card (same recipe, amber border). */
const WARN_BUTTON =
  'mis-press mis-ripple flex min-h-14 w-full touch-manipulation items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-center text-base font-semibold text-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700';

export function SupervisorHome({ header, clearanceBlocker, blocker, machines, signOff, crew }: SupervisorHomeProps) {
  const [isClearing, startClearing] = useTransition();
  const [clearError, setClearError] = useState<string | null>(null);

  const handleClear = () => {
    if (!clearanceBlocker) return;
    startClearing(async () => {
      setClearError(null);
      const result = await clearLineAction({ machineId: clearanceBlocker.machineId, orderId: clearanceBlocker.orderId });
      // A refusal comes back as a value, never a throw: in a production build a
      // thrown error reaches the browser as a generic string (Appendix B §B.10.3).
      if (!result.ok) setClearError(result.detail);
    });
  };

  return (
    <HomeStack>
      <HeaderCard title={header.title} meta={header.meta} />

      {/* The one hero card on this screen. */}
      <Card tone="hero" className="mis-rise p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100">On the floor</p>
        <Link
          href="/mis/production"
          className="mis-press mis-ripple mt-2 flex min-h-14 w-full touch-manipulation items-center justify-center rounded-xl bg-white px-4 text-center text-lg font-bold text-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          + Record production
        </Link>
      </Card>
      {/* V2 Epic 3 — a material ask goes to the Store for approval; nothing moves until then. */}
      <Link href="/mis/store/requests/new" className={cn(QUIET_LINK, 'mis-rise')}>
        Request material from the store
      </Link>
      {/* R2-342: the Supervisor now holds queue.review and resolves the floor's parked entries. */}
      <Link href="/mis/queue" className={cn(QUIET_LINK, 'mis-rise')}>
        Open the parked-entries inbox
      </Link>

      {/* What is still on this device — the count belongs here, at the button that
          made the entry, as well as in the header (MIS-155). Empty renders nothing. */}
      <PendingSyncNote />

      {clearanceBlocker ? (
        <WarnCard className="mis-rise">
          <SectionLabel>Line clearance needed</SectionLabel>
          <p className="mb-3 mt-1 font-semibold text-slate-900">
            {clearanceBlocker.machineName} · {clearanceBlocker.orderNumber} cannot start
          </p>
          <button type="button" onClick={handleClear} disabled={isClearing} className={cn(WARN_BUTTON, 'disabled:opacity-60')}>
            Clear the line
          </button>
          {clearError && <p className="mt-2 text-sm font-semibold text-amber-900">{clearError}</p>}
        </WarnCard>
      ) : (
        blocker && (
          <WarnCard className="mis-rise">
            <SectionLabel>Quality hold</SectionLabel>
            <p className="mt-1 font-semibold text-slate-900">
              {blocker.orderNumber} failed {blocker.parameterName}
            </p>
            <p className="mb-3 text-sm text-slate-600">
              {blocker.defectType ? `${blocker.defectType} · ` : ''}
              {blocker.since}. The line stays down until this is cleared.
            </p>
            <Link href={`/mis/qc/${blocker.orderId}`} className={WARN_BUTTON}>
              Open the check
            </Link>
          </WarnCard>
        )
      )}

      <InfoCard>
        <div className="mb-2 flex items-center justify-between gap-2">
          <SectionLabel>My machines</SectionLabel>
          <Link href="/mis/machine-board" className="inline-flex min-h-11 items-center text-xs font-semibold text-indigo-600">
            All {machines.total} visible
          </Link>
        </div>
        {machines.total === 0 ? (
          <EmptyNote>No machines have been added to the masters yet.</EmptyNote>
        ) : (
          <StatTrio
            items={[
              { value: machines.free, label: 'Free', tone: 'ok', href: '/mis/machine-board' },
              { value: machines.running, label: 'Running', tone: 'risk', href: '/mis/machine-board' },
              { value: machines.down, label: 'Down', tone: 'bad', href: '/mis/machine-board' },
            ]}
          />
        )}
      </InfoCard>

      <InfoCard>
        <div className="mb-1 flex items-center justify-between gap-2">
          <SectionLabel>Waiting on your sign-off</SectionLabel>
          {signOff.total > 0 && <Chip tone="action">{signOff.total}</Chip>}
        </div>
        {signOff.rows.length === 0 ? (
          <EmptyNote>Nothing is waiting on your sign-off.</EmptyNote>
        ) : (
          signOff.rows.map((row) => (
            <RowLink
              key={row.id}
              href={`/mis/production/sign-off/${row.id}`}
              title={
                <>
                  {row.processName} <Mono>{row.orderNumber}</Mono>
                </>
              }
              detail={row.detail}
              right={<Chip tone="action">Sign off</Chip>}
            />
          ))
        )}
      </InfoCard>

      <InfoCard>
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>My crew today</SectionLabel>
          <Link href="/mis/crew" className="inline-flex min-h-11 items-center text-xs font-semibold text-indigo-600">
            Open crew board
          </Link>
        </div>
        <div className="mt-2">
          {crew.recorded ? (
            <>
              <BigStat value={crew.present} total={crew.headcount} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Chip tone="bad">{crew.absent} absent</Chip>
                <Chip tone="neutral">{crew.onLeave} on leave</Chip>
              </div>
            </>
          ) : (
            <EmptyNote>Nothing has been entered on today’s register yet.</EmptyNote>
          )}
          <Link href="/mis/crew" className="mt-2 flex min-h-11 items-center text-sm text-slate-700">
            On machines {crew.onMachines} · Free (in) {crew.free} · Unstaffed bookings {crew.unstaffedBookings}
          </Link>
        </div>
      </InfoCard>
    </HomeStack>
  );
}
