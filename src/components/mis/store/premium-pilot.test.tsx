import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/app/(mis)/mis/store/actions', () => ({ storeInAction: vi.fn(), storeOutAction: vi.fn() }));

const { StoreDashboardScreen } = await import('./store-dashboard-screen');
afterEach(cleanup);

const stats = {
  totalItems: 3, lowStockCount: 0, outOfStockCount: 0, todayIn: 0, todayOut: 0,
  totalStockValue: null, hasDemo: false, recentTxns: [],
} as never;

describe('store premium pilot', () => {
  it('dashboard keeps every report link with the same href', () => {
    render(<StoreDashboardScreen stats={stats} isOwner={false} />);
    const href = (name: string) => screen.getAllByRole('link', { name: new RegExp(name) })[0].getAttribute('href');
    expect(href('Issue material')).toBe('/mis/store/issue');
    expect(href('Receive goods')).toBe('/mis/store/receive');
    expect(href('All Items')).toBe('/mis/store');
    expect(href('Full Log')).toBe('/mis/store/transactions');
    expect(href('Stock Report')).toBe('/mis/store/stock');
    fireEvent.click(screen.getByRole('button', { name: 'More reports' }));
    expect(screen.getByRole('menuitem', { name: 'Physical count' }).getAttribute('href')).toBe('/mis/store/count');
    expect(screen.getByRole('menuitem', { name: 'Requests' }).getAttribute('href')).toBe('/mis/store/requests');
  });
});
