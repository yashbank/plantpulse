'use client';

import { PageHeader } from '@/components/mis/kit/page-header';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { deleteSalaryAdvanceAction, recordSalaryAdvanceAction } from '@/app/(mis)/mis/payroll/actions';
import { Button } from '@/components/mis/kit/button';
import { Input, NumberInput } from '@/components/mis/kit/input';
import { EmptyState } from '@/components/mis/kit/empty-state';
import { RowActions } from '@/components/mis/kit/row-actions';
import { Combobox } from '@/components/ui/combobox';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type SalaryAdvanceView = { id: string; employeeId: string; employeeName: string; employeeCode: string; amountFormatted: string; notes: string | null; createdAt: string };

/**
 * R2-324: the Owner's list of salary advances to recover from this month's pay. Payroll deducts each employee's total
 * (after PF / ESIC / PT, never below zero); the bank file and payslips show the net.
 */
export function SalaryAdvancesScreen({ year, month, closed, advances, employees }: {
  year: number; month: number; closed: boolean;
  advances: SalaryAdvanceView[];
  employees: { id: string; name: string; employeeCode: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, confirmDialog } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const save = () => startTransition(async () => {
    if (!employeeId) return;
    const res = await recordSalaryAdvanceAction({ employeeId, year, month, amount: Number(amount), notes });
    if (!res.ok) { toast('error', res.detail); return; }
    setAmount(''); setNotes('');
    router.refresh();
  });
  const remove = async (a: SalaryAdvanceView) => {
    if (!(await confirm({ title: 'Remove this advance?', message: `${a.employeeName} · ${a.amountFormatted}. It will no longer be deducted from ${MONTHS[month - 1]} ${year}.`, confirmLabel: 'Remove', destructive: true }))) return;
    startTransition(async () => {
      const res = await deleteSalaryAdvanceAction(a.id);
      if (!res.ok) { toast('error', res.detail); return; }
      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">🔒 Visible to you only</div>
      <PageHeader
        title={`Salary advances to recover — ${MONTHS[month - 1]} ${year}`}
        className="mis-rise mb-0"
        breadcrumbs={[{ label: 'Payroll', href: `/mis/payroll?year=${year}&month=${month}` }, { label: 'Salary advances' }]}
        meta="Each amount is deducted from that person's pay for this month, after PF, ESIC and Professional Tax, never below zero. The bank file and payslip show the net."
      />

      {closed ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">This month is closed; reopen it to change its deductions.</p>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <Combobox label="Employee" value={employeeId} options={employees.map((e) => ({ value: e.id, label: e.name, hint: e.employeeCode }))} onChange={(v) => setEmployeeId(v || null)} />
          <NumberInput label="Amount to recover this month (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button onClick={save} disabled={isPending || !employeeId || !(Number(amount) > 0)}>Record advance</Button>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
        {advances.length === 0 ? (
          <EmptyState title="No advances recorded for this month." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {advances.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{a.employeeName} <span className="font-mono text-xs text-slate-500">{a.employeeCode}</span></p>
                  <p className="text-sm text-slate-600">{a.amountFormatted}{a.notes ? ` · ${a.notes}` : ''}</p>
                </div>
                {!closed && <RowActions items={[{ key: 'remove', label: 'Remove', danger: true, disabled: isPending, onSelect: () => void remove(a) }]} />}
              </li>
            ))}
          </ul>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
