import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/(mis)/mis/orders/actions', () => ({ updateOrderStatusAction: vi.fn() }));

import { OrderStatusActions } from './order-status-actions';

const base = { orderId: 'o1', orderNumber: 'ORD-1', gates: [], canOverride: true, override: null };
const menuItems = [
  { key: 'view', label: 'View', href: '/mis/orders/o1' },
  { key: 'edit', label: 'Edit', onSelect: vi.fn() },
];
const show = (status: string) => render(<OrderStatusActions {...base} status={status} layout="menu" menuItems={menuItems} />);

describe('order row actions menu layout', () => {
  it.each([
    ['DRAFT', 'Confirm'],
    ['CONFIRMED', 'Start production'],
    ['IN_PRODUCTION', 'Mark complete'],
    ['COMPLETED', 'Mark delivered'],
  ])('%s shows primary button %s', (status, label) => {
    show(status);
    const btn = screen.getByRole('button', { name: label });
    expect(btn.className).toContain('mis-action');
  });

  it('trigger is labelled, 44px class, and aria-expanded toggles', () => {
    show('IN_PRODUCTION');
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger.className).toContain('mis-row-trigger');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('IN_PRODUCTION menu holds View, Edit, Cancel order (cancel last)', () => {
    show('IN_PRODUCTION');
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const labels = screen.getAllByRole('menuitem').map((m) => m.textContent);
    expect(labels).toEqual(['View', 'Edit', 'Cancel order']);
  });

  it('Escape closes the menu', () => {
    show('IN_PRODUCTION');
    const trigger = screen.getByRole('button', { name: 'More actions' });
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getAllByRole('menuitem')[0], { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
  });

  it('read-only orders screen shows only View', async () => {
    vi.resetModules();
    const { OrdersScreen } = await import('./orders-screen');
    const order = { id: 'o1', orderNumber: 'ORD-1', status: 'IN_PRODUCTION', customer: { name: 'Acme' }, description: null, quantity: null, unit: null, customerPoRef: null, deliveryDate: null, createdAt: new Date().toISOString() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<OrdersScreen orders={[order] as any} customers={[]} canWrite={false} />);
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
    expect(screen.queryByText('Mark complete')).toBeNull();
    expect(screen.getAllByLabelText('View').length).toBeGreaterThan(0);
  });
});
