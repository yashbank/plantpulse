import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), usePathname: () => '/', useSearchParams: () => new URLSearchParams() }));
vi.mock('@/app/(mis)/mis/po/actions', () => ({ createPoAction: vi.fn() }));
vi.mock('@/app/(mis)/mis/grn/actions', () => ({ createGrnAction: vi.fn() }));

const { PoListScreen } = await import('../po/po-list-screen');
const { GrnListScreen } = await import('../grn/grn-list-screen');
const { StoreStockScreen } = await import('./store-stock-screen');
afterEach(cleanup);

describe('store / purchasing premium roll-out', () => {
  it('PO list: one h1 via PageHeader, New PO action kept, status badge has a dot', () => {
    const pos = [{ id: 'p1', poNumber: 'PO-1', status: 'APPROVED', bomRef: null, supplier: { id: 's', name: 'Acme' }, _count: { items: 2 }, createdAt: new Date('2026-01-01') }];
    const { container } = render(<PoListScreen pos={pos} suppliers={[]} canWrite />);
    expect(screen.getAllByRole('heading', { level: 1, name: 'Purchase Orders' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: '+ New PO' })).toBeTruthy();
    expect(container.querySelector('[data-badge-dot]')).toBeTruthy();
  });

  it('GRN list hides New GRN without approved POs', () => {
    render(<GrnListScreen grns={[]} approvedPos={[]} canWrite />);
    expect(screen.getByRole('heading', { level: 1, name: 'Goods Receipt Notes' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '+ New GRN' })).toBeNull();
  });

  it('stock KPI cards keep the exact final numbers', () => {
    render(<StoreStockScreen rows={[]} isOwner={false} />);
    const cards = screen.getAllByTestId('stock-kpi-card');
    expect(cards).toHaveLength(4);
    expect(cards[0].textContent).toContain('0');
  });
});
