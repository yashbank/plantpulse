'use client';

import { Card } from '../kit/card';
import { CountUp } from '../kit/count-up';
import { SpotlightCard } from '../kit/spotlight-card';
import {
  AlertRow,
  BigStat,
  CheckIcon,
  Divider,
  EmptyNote,
  FailCard,
  HeaderCard,
  HomeStack,
  InfoCard,
  Mono,
  MoneyCard,
  OkCard,
  PrimaryButton,
  SectionLabel,
  WarnCard,
  type AlertTone,
} from './cards';

export type OwnerAlert = {
  id: string;
  tone: AlertTone;
  title: string;
  detail: string;
  href?: string;
};

export type OwnerHomeProps = {
  header: { title: string; meta: string };
  approvals: {
    total: number;
    /** `age` is omitted when a row has no dated origin to measure from. */
    rows: { id: string; title: string; detail: string; age?: string }[];
  };
  alerts: OwnerAlert[];
  yesterday: {
    label: string;
    produced: number;
    waste: number;
    machinesRun: number;
    recorded: boolean;
  };
  wages: { monthLabel: string; gross: number; ot: number; headcount: number } | null;
};

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

/**
 * The owner home.
 *
 * Approvals first because they are the only thing here that is literally
 * blocking someone else's work; money last because it is the thing the owner
 * will look at whether or not it is at the top.
 */
export function OwnerHome({ header, approvals, alerts, yesterday, wages }: OwnerHomeProps) {
  const worst: AlertTone = alerts.some((a) => a.tone === 'stopped') ? 'stopped' : 'risk';
  const AttentionCard = alerts.length === 0 ? InfoCard : worst === 'stopped' ? FailCard : WarnCard;

  return (
    <HomeStack>
      <div className="mis-rise">
        <HeaderCard title={header.title} meta={header.meta} />
      </div>

      {approvals.total > 0 ? (
        <section className="mis-rise">
        <Card tone="hero">
          {/* R1: a square count badge beside the title, not a big number underneath it —
              the badge and the two-line title read together as one fact. */}
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xl font-bold text-white">
              <CountUp value={approvals.total} />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-semibold text-white">Waiting on you</p>
              <p className="text-sm text-indigo-100">Nothing moves until you approve</p>
            </div>
          </div>
          <div className="mt-3 border-t border-white/20">
            {approvals.rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 py-1.5">
                <p className="min-w-0 truncate text-sm font-medium text-white">{row.title}</p>
                {row.age && (
                  <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white">
                    {row.age}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <PrimaryButton href="/mis/approvals" icon={<CheckIcon />} className="bg-white text-indigo-800 hover:bg-indigo-50">
              Review approvals
            </PrimaryButton>
          </div>
        </Card>
        </section>
      ) : (
        <div className="mis-rise">
          <OkCard className="shadow-card">
            <SectionLabel>Waiting on you</SectionLabel>
            <p className="mt-1 font-semibold text-slate-900">Nothing is waiting on your approval.</p>
          </OkCard>
        </div>
      )}

      <div className="mis-rise">
      <AttentionCard className="shadow-card">
        <SectionLabel>Needs attention</SectionLabel>
        <div className="mt-1">
          {alerts.length === 0 ? (
            <EmptyNote>Nothing is stopped and no order is at risk right now.</EmptyNote>
          ) : (
            alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                tone={alert.tone}
                title={alert.title}
                detail={alert.detail}
                href={alert.href}
              />
            ))
          )}
        </div>
      </AttentionCard>
      </div>

      <div className="mis-rise">
      <InfoCard className="shadow-card">
        <SectionLabel>{yesterday.label}</SectionLabel>
        <div className="mt-2">
          {yesterday.recorded ? (
            <div className="grid grid-cols-3 gap-2">
              <SpotlightCard className="p-3 text-center">
                <span className="block text-2xl font-bold leading-none text-slate-900"><CountUp value={yesterday.produced} /></span>
                <span className="mt-1 block text-[11px] font-medium text-slate-600">Output Nos</span>
              </SpotlightCard>
              <SpotlightCard className={yesterday.waste > 0 ? 'border-amber-200 bg-amber-50 p-3 text-center' : 'p-3 text-center'}>
                <span className={`block text-2xl font-bold leading-none ${yesterday.waste > 0 ? 'text-amber-800' : 'text-slate-900'}`}>{yesterday.waste.toLocaleString('en-IN')}</span>
                <span className="mt-1 block text-[11px] font-medium text-slate-600">Wastage Kg</span>
              </SpotlightCard>
              <SpotlightCard className="p-3 text-center">
                <span className="block text-2xl font-bold leading-none text-slate-900"><CountUp value={yesterday.machinesRun} /></span>
                <span className="mt-1 block text-[11px] font-medium text-slate-600">Machines run</span>
              </SpotlightCard>
            </div>
          ) : (
            <EmptyNote>No production was logged on that day.</EmptyNote>
          )}
        </div>
      </InfoCard>
      </div>

      {wages && (
        <div className="mis-rise">
        <MoneyCard title={`Wage bill · ${wages.monthLabel}`}>
          <BigStat value={inr(wages.gross)} label={`${wages.headcount} people on the register`} />
          <Divider />
          <p className="text-sm text-slate-600">
            Overtime {inr(wages.ot)} <Mono>of the total</Mono>
          </p>
        </MoneyCard>
        </div>
      )}
    </HomeStack>
  );
}
