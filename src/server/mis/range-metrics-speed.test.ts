/**
 * Speed pass: output and scrap-rate share ONE production-log query per request (React `cache`), and the figures they
 * return are byte-identical to the ones from two separate queries.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { KeyRange } from '@/lib/mis/report-range';

const world = { calls: 0, logs: [] as Record<string, unknown>[] };

// A faithful stand-in for React's per-request cache: memoise on the primitive args.
let memo = new Map<string, unknown>();
vi.mock('react', async (orig) => ({
  ...(await orig<typeof import('react')>()),
  cache: <A extends unknown[], R>(fn: (...a: A) => R) => (...a: A): R => {
    const k = JSON.stringify([fn.toString(), a]);
    if (!memo.has(k)) memo.set(k, fn(...a));
    return memo.get(k) as R;
  },
}));
vi.mock('@/server/db', () => ({
  db: {
    misProductionLog: {
      findMany: async () => {
        world.calls += 1;
        return world.logs;
      },
    },
  },
}));
vi.mock('@/server/auth', () => ({ getCurrentUser: async () => ({ id: 'u1' }) }));
vi.mock('@/server/mis/roles', () => ({ getMisRole: async () => 'OWNER' }));
vi.mock('@/server/mis/business-rules', () => ({ getFactoryTimezone: async () => 'Asia/Kolkata', getAqlThresholds: async () => ({}) }));

const { getRangeProduction, getRangeScrapRate } = await import('./range-metrics');

const NOV: KeyRange = { freq: 'month', at: '2026-11-01', fromKey: '2026-11-01', toKey: '2026-12-01', label: 'Nov 2026', days: 30, prevAt: '', nextAt: '' } as KeyRange;
const log = (d: string, p: number, w: number, unit: string, phase: string | null) => ({
  loggedAt: new Date(`${d}T06:00:00Z`),
  qtyProduced: p,
  qtyWaste: w,
  unit,
  machineId: 'm1',
  jobPhase: phase ? { process: { name: phase } } : null,
});

beforeEach(() => {
  memo = new Map();
  world.calls = 0;
  world.logs = [log('2026-11-03', 100, 5, 'PIECE', 'Cutting'), log('2026-11-04', 50, 10, 'PIECE', null), log('2026-11-04', 9, 1, 'KG', 'Cutting')];
});

describe('shared production-log fetch', () => {
  it('reads the logs once for output and scrap-rate together', async () => {
    await Promise.all([getRangeProduction(NOV), getRangeScrapRate(NOV)]);
    expect(world.calls).toBe(1);
  });

  it('returns the same figures as two independent reads', async () => {
    const [prod, scrap] = await Promise.all([getRangeProduction(NOV), getRangeScrapRate(NOV)]);
    memo = new Map();
    const prodAlone = await getRangeProduction(NOV);
    memo = new Map();
    const scrapAlone = await getRangeScrapRate(NOV);
    expect(prod).toEqual(prodAlone);
    expect(scrap).toEqual(scrapAlone);
    expect(scrap.unit).toBe('PIECE');
    expect(scrap.overallPct).toBe(9.1);
  });
});
