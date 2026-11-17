/**
 * Premium roll-out, owner/admin group: the kit pieces are in place and the numbers read the same.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminHome } from './admin-home';
import { OwnerHome } from './owner-home';

const HEADER = { title: 'Good morning', meta: 'Monday' };
const YESTERDAY = { label: 'Yesterday', produced: 40850, waste: 18.5, machinesRun: 17, recorded: true };

describe('OwnerHome premium', () => {
  it('KPI numbers keep their final text and the wage bill is plain text, never animated', () => {
    render(
      <OwnerHome
        header={HEADER}
        approvals={{ total: 3, rows: [{ id: 'a', title: 'ORD-1', detail: '', age: '2 days' }] }}
        alerts={[]}
        yesterday={YESTERDAY}
        wages={{ monthLabel: 'Sep', gross: 1234567, ot: 5000, headcount: 40 }}
      />,
    );
    expect(screen.getByText('40,850')).toBeTruthy();
    expect(screen.getByText('17')).toBeTruthy();
    expect(screen.getByText('18.5')).toBeTruthy();
    expect(screen.getByText(/12,34,567/)).toBeTruthy();
  });

  it('has exactly one hero card and no money for a non-owner payload', () => {
    const { container, queryByText } = render(
      <OwnerHome
        header={HEADER}
        approvals={{ total: 1, rows: [{ id: 'a', title: 'ORD-1', detail: '' }] }}
        alerts={[]}
        yesterday={YESTERDAY}
        wages={null}
      />,
    );
    expect(container.querySelectorAll('.rounded-\\[1\\.25rem\\]').length).toBe(1);
    expect(queryByText(/Wage bill/)).toBeNull();
  });
});

describe('AdminHome premium', () => {
  it('attendance count keeps its text and the first viewport staggers', () => {
    const { container } = render(
      <AdminHome
        header={HEADER}
        orders={[]}
        attendance={{ present: 61, headcount: 70, recorded: true }}
        hindiGap={{ total: 0 }}
        queue={{ total: 0 }}
      />,
    );
    expect(screen.getByText('61')).toBeTruthy();
    expect(container.querySelectorAll('.mis-rise').length).toBeGreaterThan(3);
  });
});
