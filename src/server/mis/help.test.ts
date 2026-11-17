import { beforeEach, describe, expect, it, vi } from 'vitest';

const user = { id: 'user-uuid-1234', email: 'person@example.com', name: 'Person' };
const requireMisAccess = vi.fn();
const getMisRole = vi.fn();
const count = vi.fn();
const logAuditEvent = vi.fn();

vi.mock('./guard', () => ({ requireMisAccess: () => requireMisAccess() }));
vi.mock('./roles', () => ({ getMisRole: (id: string) => getMisRole(id) }));
vi.mock('./audit', () => ({ logAuditEvent: (e: unknown) => logAuditEvent(e) }));
vi.mock('@/server/db', () => ({ db: { misAuditLog: { count: (a: unknown) => count(a) } } }));
vi.mock('@/lib/mis/help/help-content', () => ({
  HELP_TOPICS: [
    { id: 'assign', title: 'Assign an employee to a machine', keywords: ['allocate worker'], requires: ['production.write'], whoCan: 'A Supervisor, Admin or Owner.', steps: ['Open the machine board', 'Pick the employee'], href: '/mis/machine-board' },
    { id: 'leave', title: 'Apply for leave', keywords: ['chutti'], requires: null, whoCan: 'Anyone.', steps: ['Open Me'], href: '/mis/me/leaves' },
  ],
}));

const { askHelp, clearHelpCache } = await import('./help');
const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  clearHelpCache();
  requireMisAccess.mockResolvedValue(user);
  getMisRole.mockResolvedValue('SUPERVISOR');
  count.mockResolvedValue(0);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  delete process.env.ANTHROPIC_API_KEY;
});

describe('askHelp', () => {
  it('empty question is rejected', async () => {
    expect(await askHelp('   ')).toMatchObject({ ok: false, reason: 'empty' });
  });

  it('confident topic answers without AI, with role-aware result, and audits topicId+source only', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const r = await askHelp('how do I assign an employee to a machine');
    expect(r).toMatchObject({ ok: true, answer: { source: 'topic', topicId: 'assign', allowed: true } });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'help.ask', after: { topicId: 'assign', source: 'topic' } }));
  });

  it('role without permission gets allowed:false and no steps', async () => {
    getMisRole.mockResolvedValue('QC');
    const r = await askHelp('assign employee to machine');
    expect(r).toMatchObject({ ok: true, answer: { allowed: false, steps: [] } });
  });

  it('no key and no match gives friendly none', async () => {
    const r = await askHelp('quarterly tax filing');
    expect(r).toMatchObject({ ok: true, answer: { source: 'none', allowed: null } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('AI path: one call, cached afterwards, body has no user data', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: 'text', text: '1. Open Me\n2. Tap leaves' }] }) });
    const r1 = await askHelp('quarterly tax filing machine');
    expect(r1).toMatchObject({ ok: true, answer: { source: 'ai', allowed: null, steps: ['Open Me', 'Tap leaves'] } });
    const r2 = await askHelp('Quarterly tax filing, machine?');
    expect(r2).toMatchObject({ ok: true, answer: { source: 'ai' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const body = String(init.body);
    expect(body).not.toContain(user.id);
    expect(body).not.toContain(user.email);
    expect(JSON.parse(body)).toMatchObject({ model: 'claude-haiku-5-5', max_tokens: 300, temperature: 0 });
    expect(body).toContain('SUPERVISOR');
  });

  it('AI failure falls back to none and is not cached', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    fetchMock.mockRejectedValue(new Error('down'));
    expect(await askHelp('quarterly tax filing')).toMatchObject({ ok: true, answer: { source: 'none' } });
    await askHelp('quarterly tax filing');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('daily question limit blocks', async () => {
    count.mockResolvedValue(60);
    expect(await askHelp('assign employee')).toMatchObject({ ok: false, reason: 'rate_limited' });
  });

  it('AI limit blocks only when AI is needed', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    count.mockImplementation(async (a: { where: { after?: unknown } }) => (a.where.after ? 8 : 5));
    expect(await askHelp('quarterly tax filing')).toMatchObject({ ok: false, reason: 'rate_limited' });
    expect(await askHelp('assign employee to machine')).toMatchObject({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
