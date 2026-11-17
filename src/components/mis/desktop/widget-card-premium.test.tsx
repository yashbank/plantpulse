import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { catalogueFor, defaultLayoutFor } from '@/lib/mis/widgets';

import { DashboardScreen } from './dashboard-screen';
import type { DashboardData } from './widgets';

const DATA: DashboardData = {
  production: { produced: 40850, waste: 18, machinesRun: 13, entries: 4 },
  series: [{ date: '1 Sep', produced: 30000, waste: 12 }],
  plan: null,
  machines: { free: 6, running: 13, down: 2, total: 21 },
  attendance: null,
  crew: null,
  approvals: null,
  orders: [],
  onTime: null,
  wastageByPhase: [],
  qc: null,
  defectsOpen: null,
  wages: { gross: 412600, ot: 38200, monthLabel: 'September', elapsedPct: 23 },
};

function setup() {
  render(
    <DashboardScreen
      role="OWNER"
      initialLayout={defaultLayoutFor('OWNER')}
      catalogue={catalogueFor('OWNER')}
      data={DATA}
      onSave={vi.fn(async () => ({ ok: true as const }))}
      onReset={vi.fn(async () => ({ ok: true as const }))}
    />,
  );
}

describe('premium widget cards', () => {
  it('every card has lift + rise, a tabular KPI and keeps its label', () => {
    setup();
    const cards = screen.getAllByRole('region');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card.className).toContain('mis-lift');
      expect(card.className).toContain('mis-rise');
      expect(card.getAttribute('aria-label')).toBeTruthy();
    }
    expect(document.querySelector('.tabular-nums')).not.toBeNull();
    expect(screen.getByTestId('widget-grid')).toBeTruthy();
  });

  it('Customise stays reachable and is a 44px action', () => {
    setup();
    const btn = screen.getByRole('button', { name: 'Customise' });
    expect(btn.className).toContain('mis-action');
    expect(btn.className).toContain('min-h-11');
  });

  it('empty states keep their message and gain an icon', () => {
    setup();
    const empty = document.querySelector('p.border-dashed svg');
    expect(empty).not.toBeNull();
  });
});
