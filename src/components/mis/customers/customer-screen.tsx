'use client';
import { FilterBar } from '@/components/mis/kit/filter-bar';
import { PageHeader } from '@/components/mis/kit/page-header';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Button } from '@/components/mis/kit/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { DataTable, type Column } from '@/components/mis/kit/data-table';
import { SlideOver } from '@/components/mis/kit/slide-over';
import { Input } from '@/components/mis/kit/input';
import { StatusBadge } from '@/components/mis/kit/status-badge';
import { saveCustomerAction, deleteCustomerAction, restoreCustomerAction } from '@/app/(mis)/mis/customers/actions';

type Customer = { id: string; code: string; name: string; nameHi: string | null; phone: string | null; city: string | null; gstNo: string | null; isActive: boolean; deletedAt: Date | null };
type Props = { customers: Customer[]; canWrite: boolean; canView?: boolean };

export function CustomerScreen({ customers, canWrite, canView = true }: Props) {
  const [open, setOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [vals, setVals] = useState({ code: '', name: '', nameHi: '', phone: '', address: '', city: '', gstNo: '' });
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [listError, setListError] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirm();

  // R3-MST B29/B31: a refusal comes back as a value and is shown inline; delete asks first.
  const removeRow = async (r: Customer) => {
    if (!(await confirm({ title: 'Delete this customer?', message: `${r.name} will be hidden from pickers. It can be restored later.`, confirmLabel: 'Delete', destructive: true }))) return;
    startTransition(async () => { const res = await deleteCustomerAction(r.id); setListError(res.ok ? null : res.detail); });
  };
  const restoreRow = (r: Customer) => startTransition(async () => { const res = await restoreCustomerAction(r.id); setListError(res.ok ? null : res.detail); });

  const filtered = search.trim()
    ? customers.filter(c => c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()) || (c.city ?? '').toLowerCase().includes(search.toLowerCase()) || (c.phone ?? '').toLowerCase().includes(search.toLowerCase()))
    : customers;

  const set = (k: keyof typeof vals) => (e: React.ChangeEvent<HTMLInputElement>) => setVals(v => ({ ...v, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setVals({ code: '', name: '', nameHi: '', phone: '', address: '', city: '', gstNo: '' }); setSaveError(null); setOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); setVals({ code: c.code, name: c.name, nameHi: c.nameHi ?? '', phone: c.phone ?? '', address: '', city: c.city ?? '', gstNo: c.gstNo ?? '' }); setSaveError(null); setOpen(true); };

  const handleSave = () => {
    startTransition(async () => {
      const r = await saveCustomerAction(editing?.id ?? null, vals);
      if (!r.ok) { setSaveError(r.detail); return; }
      setOpen(false);
    });
  };

  function downloadCsv() {
    const headers = ['Code', 'Name', 'City', 'Phone', 'GST No', 'Active'];
    const rows = customers.map(c => [c.code, c.name, c.city ?? '', c.phone ?? '', c.gstNo ?? '', c.isActive ? 'Yes' : 'No']);
    const lines = [headers, ...rows].map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<Customer>[] = [
    { key: 'code', header: 'Code', render: (r) => <span className="font-mono text-sm">{r.code}</span> },
    { key: 'name', header: 'Name', render: (r) => <div><div>{r.name}</div>{r.nameHi && <div className="text-xs text-slate-500">{r.nameHi}</div>}</div> },
    { key: 'city', header: 'City', render: (r) => r.city ?? '—' },
    { key: 'phone', header: 'Phone', render: (r) => r.phone ?? '—' },
    { key: 'gstNo', header: 'GST No', render: (r) => r.gstNo ?? '—' },
    { key: 'isActive', header: 'Active', render: (r) => <StatusBadge dot tone={r.isActive ? 'good' : 'neutral'}>{r.isActive ? 'Active' : 'Inactive'}</StatusBadge> },
    { key: 'actions', header: '', render: (r) => (
      <div className="flex gap-2 justify-end">
        {canView && <Link href={`/mis/customers/${r.id}`}><Button variant="ghost">View</Button></Link>}
        {!r.deletedAt && canWrite && <Button variant="ghost" onClick={() => openEdit(r)}>Edit</Button>}
        {!r.deletedAt && canWrite && <Button variant="ghost" onClick={() => removeRow(r)}>Delete</Button>}
        {r.deletedAt && canWrite && <Button variant="ghost" onClick={() => restoreRow(r)}>Restore</Button>}
      </div>
    )},
  ];

  return (
    <div className="mx-auto max-w-5xl flex flex-col gap-4">
      <PageHeader
        title="Customers"
        className="mb-0"
        actions={
          <>
            <Button variant="ghost" onClick={downloadCsv}>↓ CSV</Button>
            {canWrite && <Button onClick={openAdd}>+ Add Customer</Button>}
          </>
        }
      />
      <FilterBar searchLabel="Search customers…" query={search} onQuery={setSearch} />
      {listError && <p role="alert" className="text-sm text-red-600">{listError}</p>}
      {confirmDialog}
      <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} emptyTitle="No customers yet" emptyBody="Add customers to create orders." />
      <SlideOver open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="flex flex-col gap-4 p-4">
          <Input label="Code" value={vals.code} onChange={set('code')} required />
          <Input label="Name" value={vals.name} onChange={set('name')} required />
          <Input label="Name (Hindi)" value={vals.nameHi} onChange={set('nameHi')} />
          <Input label="Phone" value={vals.phone} onChange={set('phone')} />
          <Input label="Address" value={vals.address} onChange={set('address')} />
          <Input label="City" value={vals.city} onChange={set('city')} />
          <Input label="GST No" value={vals.gstNo} onChange={set('gstNo')} />
          {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isPending || !vals.name || !vals.code}>{isPending ? 'Saving…' : 'Save'}</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
