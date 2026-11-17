'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/mis/kit/button';
import { StatusBadge } from '@/components/mis/kit/status-badge';
import { Card } from '@/components/mis/kit/card';
import { EmptyState } from '@/components/mis/kit/empty-state';
import { RowActions } from '@/components/mis/kit/row-actions';
import Link from 'next/link';
import { SlideOver } from '@/components/mis/kit/slide-over';
import { Input } from '@/components/mis/kit/input';
import { useToast } from '@/components/ui/toast';
import type { ActionResult } from '@/lib/mis/action-result';
import { approveBomAction, rejectBomAction, approveLeaveAction, approvePOAction, approveExtraPayDayAction, rejectExtraPayDayAction } from '@/app/(mis)/mis/approvals/actions';
import { poPurpose, poPurposeLabel } from '@/lib/mis/po-purpose';

type ExtraPayDay = {
  id: string; date: Date; kind: 'MULTIPLIER' | 'FLAT_AMOUNT'; value: number;
  scope: 'ALL_PRESENT' | 'EMPLOYEES' | 'DEPARTMENTS'; reason: string; proposedByName?: string | null;
};

type Pending = {
  boms: { id: string; order: { id: string; orderNumber: string; description: string | null } | null }[];
  leaves: { id: string; date: Date; endDate?: Date | null; leaveType?: string; reason: string | null; employee: { name: string; employeeCode: string } | null }[];
  pos: { id: string; poNumber: string; bomRef: string | null; supplier: { name: string } | null }[];
  // Non-empty ONLY when the caller holds wages.read (server gate, approvals.ts) — every other
  // role sharing this queue (Admin, Supervisor, QC all hold orders.read) gets an empty array,
  // never a redacted one (D24).
  extraPayDays: ExtraPayDay[];
  total: number;
  /** One line per query that failed (R3 B110); the screen must not read as "all caught up". */
  errors?: string[];
};

type Props = { pending: Pending; isOwner: boolean; canWrite: boolean };

export function ApprovalsScreen({ pending, isOwner, canWrite: _canWrite }: Props) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  // A refusal (e.g. "this PO has no line items") comes back as a value; show it instead of dropping it.
  const settle = (result: ActionResult<unknown>) => { if (!result.ok) toast('error', result.detail); return result.ok; };
  const [rejecting, setRejecting] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [reason, setReason] = useState('');

  const rejectBom = () => {
    if (!rejecting) return;
    startTransition(async () => {
      if (settle(await rejectBomAction(rejecting.orderId, reason))) { setRejecting(null); setReason(''); }
    });
  };
  const approveBom = (id: string) => startTransition(async () => { settle(await approveBomAction(id)); });
  const approveLeave = (id: string, approve: boolean) => startTransition(async () => { settle(await approveLeaveAction(id, approve)); });
  const approvePO = (id: string) => startTransition(async () => { settle(await approvePOAction(id)); });
  const approveExtraPay = (id: string) => startTransition(async () => { settle(await approveExtraPayDayAction(id)); });
  const rejectExtraPay = (id: string) => startTransition(async () => { settle(await rejectExtraPayDayAction(id)); });

  const errorLines = pending.errors?.length ? (
    <div role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
      {pending.errors.map((e) => <p key={e}>{e}</p>)}
    </div>
  ) : null;

  if (pending.total === 0 && errorLines) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">Approval Queue</h1>
        {errorLines}
      </div>
    );
  }

  if (pending.total === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">Approval Queue</h1>
        <EmptyState title="All caught up!" body="No pending approvals." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Approval Queue</h1>
        <span className="bg-red-100 text-red-700 text-sm font-bold rounded-full px-2.5 py-0.5">{pending.total}</span>
      </div>

      {errorLines}

      {/* BOM Approvals */}
      {isOwner && pending.boms.length > 0 && (
        <QueueSection title="Bill of Materials" count={pending.boms.length}>
          {pending.boms.map(bom => (
            <QueueRow
              key={bom.id}
              title={bom.order?.orderNumber ?? '—'}
              subtitle={bom.order?.description ?? 'No description'}
              badge={<StatusBadge tone="warning">Pending Approval</StatusBadge>}
              actions={
                <>
                  <Button variant="go" onClick={() => approveBom(bom.id)} disabled={isPending}>Approve</Button>
                  <RowActions
                    items={[
                      { key: 'view', label: 'View BOM', href: `/mis/bom/${bom.order?.id ?? ''}` },
                      ...(bom.order
                        ? [{ key: 'reject', label: 'Reject', danger: true, disabled: isPending, onSelect: () => { setReason(''); setRejecting({ orderId: bom.order!.id, orderNumber: bom.order!.orderNumber }); } }]
                        : []),
                    ]}
                  />
                </>
              }
            />
          ))}
        </QueueSection>
      )}

      {/* Leave Approvals */}
      {pending.leaves.length > 0 && (
        <QueueSection title="Leave Requests" count={pending.leaves.length}>
          {pending.leaves.map(leave => (
            <QueueRow
              key={leave.id}
              title={leave.employee?.name ?? '—'}
              subtitle={`${leave.employee?.employeeCode ?? ''} · ${new Date(leave.date).toLocaleDateString('en-IN')}${leave.endDate ? ` – ${new Date(leave.endDate).toLocaleDateString('en-IN')}` : ''}${leave.leaveType && leave.leaveType !== 'OTHER' ? ` · ${leave.leaveType}` : ''}${leave.reason ? ` — ${leave.reason}` : ''}`}
              badge={<StatusBadge tone="warning">Pending</StatusBadge>}
              actions={
                <>
                  <Button variant="go" onClick={() => approveLeave(leave.id, true)} disabled={isPending}>Approve</Button>
                  <RowActions items={[{ key: 'reject', label: 'Reject', danger: true, disabled: isPending, onSelect: () => approveLeave(leave.id, false) }]} />
                </>
              }
            />
          ))}
        </QueueSection>
      )}

      {/* PO Approvals */}
      {isOwner && pending.pos.length > 0 && (
        <QueueSection title="Purchase Orders" count={pending.pos.length}>
          {pending.pos.map(po => (
            <QueueRow
              key={po.id}
              title={po.poNumber}
              subtitle={[po.supplier?.name ?? 'No supplier', poPurposeLabel(poPurpose(po))].join(' · ')}
              badge={<StatusBadge tone="warning">Pending Approval</StatusBadge>}
              actions={
                <>
                  <Button variant="go" onClick={() => approvePO(po.id)} disabled={isPending}>Approve</Button>
                  <Link href="/mis/po" className="inline-flex min-h-11 items-center whitespace-nowrap text-sm font-medium text-indigo-700 hover:underline">View PO</Link>
                </>
              }
            />
          ))}
        </QueueSection>
      )}

      {/* Extra-pay days (25.4, D28) — the array is only ever non-empty for the Owner already. */}
      <SlideOver open={rejecting !== null} onClose={() => setRejecting(null)} title={`Reject BOM${rejecting ? ` · ${rejecting.orderNumber}` : ''}`}>
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-slate-600">The BOM goes back to draft so it can be fixed and submitted again. Say what needs changing.</p>
          <Input label="Reason" value={reason} onChange={e => setReason(e.target.value)} />
          <div className="flex gap-2 pt-2">
            <Button variant="danger" onClick={rejectBom} disabled={isPending || reason.trim().length < 3}>Reject BOM</Button>
            <Button variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
          </div>
        </div>
      </SlideOver>

      {isOwner && pending.extraPayDays.length > 0 && (
        <QueueSection title="Extra-pay days" count={pending.extraPayDays.length}>
          {pending.extraPayDays.map((day) => (
            <QueueRow
              key={day.id}
              title={`${new Date(day.date).toLocaleDateString('en-IN')} · ${day.kind === 'FLAT_AMOUNT' ? `₹${day.value}` : `×${day.value}`}`}
              subtitle={`${day.scope === 'ALL_PRESENT' ? 'Everyone present' : day.scope === 'EMPLOYEES' ? 'Specific employees' : 'Specific departments'} — ${day.reason}${day.proposedByName ? ` · proposed by ${day.proposedByName}` : ''}`}
              badge={<StatusBadge tone="warning">Pending</StatusBadge>}
              actions={
                <>
                  <Button variant="go" onClick={() => approveExtraPay(day.id)} disabled={isPending}>Approve</Button>
                  <RowActions items={[{ key: 'reject', label: 'Reject', danger: true, disabled: isPending, onSelect: () => rejectExtraPay(day.id) }]} />
                </>
              }
            />
          ))}
        </QueueSection>
      )}
    </div>
  );
}

function QueueSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="mis-rise mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-slate-700">{title}</h2>
        <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{count}</span>
      </div>
      <Card raised className="divide-y divide-slate-100 p-0">
        {children}
      </Card>
    </div>
  );
}

function QueueRow({ title, subtitle, badge, actions }: { title: string; subtitle: string; badge: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 gap-4 flex-wrap">
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {badge}
        {actions}
      </div>
    </div>
  );
}
