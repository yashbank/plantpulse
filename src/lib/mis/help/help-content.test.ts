import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { can, MIS_ACTIONS } from '../permissions';
import { MIS_ROLES, type MisRoleName } from '../roles';
import { HELP_TOPICS } from './help-content';
import type { HelpTopic } from './types';

const MIS_ROOT = path.join(process.cwd(), 'src/app/(mis)/mis');

function doable(role: MisRoleName, topic: HelpTopic): boolean {
  return topic.requires === null || topic.requires.every((a) => can(role, a));
}

/** Walk the route segments; a segment may match a literal folder or a [param] folder. */
function routeExists(dir: string, segments: string[]): boolean {
  if (segments.length === 0) return existsSync(path.join(dir, 'page.tsx'));
  const [head, ...rest] = segments;
  const literal = path.join(dir, head);
  if (existsSync(literal) && routeExists(literal, rest)) return true;
  return readdirSync(dir, { withFileTypes: true }).some(
    (e) => e.isDirectory() && /^\[[^\]]+\]$/.test(e.name) && routeExists(path.join(dir, e.name), rest),
  );
}

describe('help content', () => {
  it('has a broad set of topics', () => {
    expect(HELP_TOPICS.length).toBeGreaterThanOrEqual(65);
  });

  it('has unique ids', () => {
    const ids = HELP_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only valid MisAction values', () => {
    const valid = new Set<string>(MIS_ACTIONS);
    for (const t of HELP_TOPICS) {
      for (const a of t.requires ?? []) expect(valid.has(a), `${t.id}: ${a}`).toBe(true);
    }
  });

  it('points href at a real /mis route', () => {
    for (const t of HELP_TOPICS) {
      if (!t.href) continue;
      const clean = t.href.split(/[?#]/)[0];
      expect(clean.startsWith('/mis'), `${t.id}: ${t.href}`).toBe(true);
      const segments = clean.replace(/^\/mis\/?/, '').split('/').filter(Boolean);
      expect(routeExists(MIS_ROOT, segments), `${t.id}: ${t.href}`).toBe(true);
    }
  });

  it('keeps steps, titles and keywords in shape', () => {
    for (const t of HELP_TOPICS) {
      expect(t.steps.length, `${t.id} steps`).toBeGreaterThanOrEqual(3);
      expect(t.steps.length, `${t.id} steps`).toBeLessThanOrEqual(6);
      for (const s of t.steps) expect(s.length, `${t.id}: ${s}`).toBeLessThan(140);
      expect(t.title.length, t.id).toBeLessThan(70);
      expect(t.keywords.length, `${t.id} keywords`).toBeGreaterThanOrEqual(4);
      expect(t.whoCan.trim().length, `${t.id} whoCan`).toBeGreaterThan(0);
    }
  });

  it.each(MIS_ROLES)('has at least 3 topics %s can do', (role) => {
    const count = HELP_TOPICS.filter((t) => doable(role, t)).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('lets a supervisor assign an employee to a machine but not QC', () => {
    const topic = HELP_TOPICS.find((t) => t.id === 'crew-assign-machine');
    expect(topic).toBeDefined();
    expect(doable('SUPERVISOR', topic!)).toBe(true);
    expect(doable('QC', topic!)).toBe(false);
  });

  it('keeps wage topics Owner-only', () => {
    for (const id of ['payroll-month-end', 'payroll-advance', 'payroll-rules']) {
      const topic = HELP_TOPICS.find((t) => t.id === id)!;
      expect(doable('OWNER', topic)).toBe(true);
      expect(doable('ADMIN', topic)).toBe(false);
    }
  });
});
