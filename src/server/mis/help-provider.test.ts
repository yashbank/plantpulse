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
    { id: 'leave', title: 'Apply for leave', keywords: ['chutti'], requires: null, whoCan: 'Anyone.', steps: ['Open Me'], href: '/mis/me/leaves' },
  ],
}));

const { askHelp, clearHelpCache, resolveAiProvider } = await import('./help');
const fetchMock = vi.fn();
const KEYS = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'HELP_AI_PROVIDER', 'HELP_OPENAI_MODEL'];

beforeEach(() => {
  vi.clearAllMocks();
  clearHelpCache();
  requireMisAccess.mockResolvedValue(user);
  getMisRole.mockResolvedValue('SUPERVISOR');
  count.mockResolvedValue(0);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  for (const k of KEYS) delete process.env[k];
});

describe('resolveAiProvider', () => {
  const cases: [Record<string, string>, string | null][] = [
    [{}, null],
    [{ ANTHROPIC_API_KEY: 'a' }, 'anthropic'],
    [{ OPENAI_API_KEY: 'o' }, 'openai'],
    [{ ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o' }, 'anthropic'],
    [{ ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o', HELP_AI_PROVIDER: 'openai' }, 'openai'],
    [{ ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o', HELP_AI_PROVIDER: 'anthropic' }, 'anthropic'],
    [{ ANTHROPIC_API_KEY: 'a', HELP_AI_PROVIDER: 'openai' }, null],
    [{ OPENAI_API_KEY: 'o', HELP_AI_PROVIDER: 'anthropic' }, null],
  ];
  it.each(cases)('env %j -> %s', (env, want) => {
    Object.assign(process.env, env);
    expect(resolveAiProvider()).toBe(want);
  });
});

describe('OpenAI provider', () => {
  const ok = { ok: true, json: async () => ({ choices: [{ message: { content: '1. Open Me\n2. Tap leaves' } }] }) };

  it('request shape, parsing, cache hit, audit source ai', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    fetchMock.mockResolvedValue(ok);
    const r1 = await askHelp('quarterly tax filing machine');
    expect(r1).toMatchObject({ ok: true, answer: { source: 'ai', steps: ['Open Me', 'Tap leaves'] } });
    await askHelp('Quarterly tax filing, machine?');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.headers.authorization).toBe('Bearer sk-test');
    const body = String(init.body);
    expect(body).not.toContain(user.id);
    expect(body).not.toContain(user.email);
    expect(body).toContain('SUPERVISOR');
    expect(JSON.parse(body)).toMatchObject({ model: 'gpt-4o-mini', max_tokens: 300, temperature: 0 });
    expect(logAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ after: { topicId: null, source: 'ai' } }));
  });

  it('HELP_OPENAI_MODEL overrides model', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.HELP_OPENAI_MODEL = 'gpt-x';
    fetchMock.mockResolvedValue(ok);
    await askHelp('quarterly tax filing');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).model).toBe('gpt-x');
  });

  it('failure -> none, not cached', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    expect(await askHelp('quarterly tax filing')).toMatchObject({ ok: true, answer: { source: 'none' } });
    fetchMock.mockRejectedValue(new Error('down'));
    expect(await askHelp('quarterly tax filing')).toMatchObject({ ok: true, answer: { source: 'none' } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('both keys + HELP_AI_PROVIDER=openai calls OpenAI', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ANTHROPIC_API_KEY = 'a';
    process.env.HELP_AI_PROVIDER = 'openai';
    fetchMock.mockResolvedValue(ok);
    await askHelp('quarterly tax filing');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions');
  });
});
