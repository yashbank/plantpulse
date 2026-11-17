/** Premium roll-out (supervisor / QC): one hero card, 48px+ targets, press feedback on tappable tiles. */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/(mis)/mis/production/actions', () => ({ clearLineAction: vi.fn() }));
vi.mock('@/components/mis/shell/pending-sync-note', () => ({ PendingSyncNote: () => null }));
vi.mock('../shell/locale-provider', () => ({ useMisLocale: () => ({ locale: 'en', setLocale: vi.fn() }) }));

const { SupervisorHome } = await import('./supervisor-home');
const { QcHome } = await import('./qc-home');

describe('supervisor home', () => {
  const props = {
    header: { title: 'Hi', meta: 'Mon' },
    clearanceBlocker: null,
    blocker: null,
    machines: { free: 1, running: 2, down: 0, total: 3 },
    signOff: { total: 0, rows: [] },
    crew: { present: 1, headcount: 2, absent: 1, onLeave: 0, recorded: true, onMachines: 1, free: 0, unstaffedBookings: 0 },
  };
  it('Record production is the hero link with a 48px+ target and press feedback', () => {
    render(<SupervisorHome {...props} />);
    const link = screen.getByRole('link', { name: '+ Record production' });
    expect(link.getAttribute('href')).toBe('/mis/production');
    expect(link.className).toContain('min-h-14');
    expect(link.className).toContain('mis-press');
  });
});

describe('QC home', () => {
  const props = {
    header: { title: 'Hi', meta: 'Mon' },
    due: { label: '10:00', minutesAway: 5 },
    slots: [{ hour: 10, label: '10:00', state: 'never' as const }],
    failures: [],
    alsoToday: [],
  };
  it('Start the check is the hero link; hourly slots have press feedback', () => {
    render(<QcHome {...props} />);
    const hero = screen.getByRole('link', { name: 'Start the 10:00 check' });
    expect(hero.className).toContain('min-h-14');
    const slot = screen.getAllByRole('link').find((l) => l.getAttribute('href') === '/mis/qc/grid')!;
    expect(slot.className).toContain('mis-press');
  });
});
