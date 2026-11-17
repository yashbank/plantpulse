import { describe, expect, it } from 'vitest';

import { buildAnswer } from './help-answer';
import { searchHelp } from './help-search';
import type { HelpTopic } from './types';

const base = { keywords: [], whoCan: 'A Supervisor, Admin or Owner.', steps: ['One', 'Two'] };
const ASSIGN: HelpTopic = { ...base, id: 'assign', title: 'Assign worker to machine', requires: ['production.write'], href: '/mis/machine-board', roleNotes: { SUPERVISOR: 'Only your own line.' } };
const PAY: HelpTopic = { ...base, id: 'pay', title: 'See payroll worker', requires: ['wages.read'], href: '/mis/payroll' };
const ME: HelpTopic = { ...base, id: 'me', title: 'My worker attendance', requires: null, href: '/mis/me/attendance' };
const ME2: HelpTopic = { ...base, id: 'me2', title: 'Another worker thing', requires: null };

describe('buildAnswer', () => {
  it('allowed role gets steps, href and its role note', () => {
    const a = buildAnswer(ASSIGN, 'SUPERVISOR');
    expect(a).toMatchObject({ source: 'topic', topicId: 'assign', allowed: true, steps: ['One', 'Two'], href: '/mis/machine-board' });
    expect(a.summary).toContain('Only your own line.');
  });
  it('role without permission: no steps, no link, says who can', () => {
    const a = buildAnswer(ASSIGN, 'QC');
    expect(a.allowed).toBe(false);
    expect(a.steps).toEqual([]);
    expect(a.href).toBeUndefined();
    expect(a.summary).toContain('A Supervisor, Admin or Owner.');
  });
  it('money topic is owner only', () => {
    expect(buildAnswer(PAY, 'OWNER').allowed).toBe(true);
    expect(buildAnswer(PAY, 'ADMIN').allowed).toBe(false);
    expect(buildAnswer(PAY, 'SUPERVISOR').href).toBeUndefined();
  });
  it('requires null is open to any signed-in role', () => {
    expect(buildAnswer(ME, 'STORE_GUY').allowed).toBe(true);
  });
  it('related = next 2 ranked topics the role can do, never itself', () => {
    const ranked = searchHelp('worker', [ASSIGN, PAY, ME, ME2]);
    const a = buildAnswer(ASSIGN, 'QC', ranked);
    expect(a.related.map((r) => r.id).sort()).toEqual(['me', 'me2']);
    expect(buildAnswer(ASSIGN, 'OWNER', ranked).related).toHaveLength(2);
  });
});
