import { buildAnswer, roleCanDo } from '@/lib/mis/help/help-answer';
import { HELP_TOPICS } from '@/lib/mis/help/help-content';
import { confidentHit, normaliseQuestion, searchHelp, type RankedTopic } from '@/lib/mis/help/help-search';
import type { HelpAnswer, HelpAskResult } from '@/lib/mis/help/types';
import type { MisRoleName } from '@/lib/mis/roles';
import { db } from '@/server/db';

import { logAuditEvent } from './audit';
import { requireMisAccess } from './guard';
import { getMisRole } from './roles';

export const HELP_QUESTION_MAX = 200;
export const HELP_LIMIT_PER_USER_DAY = 60;
export const HELP_AI_LIMIT_PER_USER_DAY = 8;
export const HELP_AI_LIMIT_PER_DAY = 400;
const CACHE_MAX = 500;
const CACHE_TTL_MS = 60 * 60 * 1000;
const AI_MODEL = 'claude-haiku-5-5';
const AI_SYSTEM = 'Answer only from the snippets. Max 4 short steps. If not covered say you do not know.';

const cache = new Map<string, { at: number; answer: HelpAnswer }>();

function cacheGet(key: string): HelpAnswer | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  cache.delete(key); // refresh recency
  cache.set(key, hit);
  return hit.answer;
}

function cacheSet(key: string, answer: HelpAnswer): void {
  cache.delete(key);
  cache.set(key, { at: Date.now(), answer });
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/** Test hook: forget every cached answer. */
export function clearHelpCache(): void {
  cache.clear();
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function noneAnswer(role: MisRoleName | null, ranked: readonly RankedTopic[]): HelpAnswer {
  return {
    source: 'none',
    title: 'No answer found',
    allowed: null,
    summary: 'I could not find this in the help topics. Try other words, or pick one of these related topics.',
    steps: [],
    related: ranked
      .filter((r) => roleCanDo(r.topic, role))
      .slice(0, 2)
      .map((r) => ({ id: r.topic.id, title: r.topic.title })),
  };
}

function parseSteps(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 4);
}

type AiProvider = 'anthropic' | 'openai';

/** HELP_AI_PROVIDER wins when its key exists; otherwise Anthropic, then OpenAI, then none. */
export function resolveAiProvider(): AiProvider | null {
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasOpenai = Boolean(process.env.OPENAI_API_KEY);
  const pref = process.env.HELP_AI_PROVIDER?.trim().toLowerCase();
  if (pref === 'anthropic') return hasAnthropic ? 'anthropic' : null;
  if (pref === 'openai') return hasOpenai ? 'openai' : null;
  if (hasAnthropic) return 'anthropic';
  if (hasOpenai) return 'openai';
  return null;
}

function finishSteps(text: string): string[] | null {
  if (!text.trim() || /\b(do not|don't|dont) know\b/i.test(text)) return null;
  const steps = parseSteps(text);
  return steps.length ? steps : null;
}

/** One small AI call. Sends only role name, the question and top-3 topic snippets. Returns null on any failure. */
async function askAi(
  provider: AiProvider,
  question: string,
  role: MisRoleName | null,
  ranked: readonly RankedTopic[],
): Promise<string[] | null> {
  const snippets = ranked
    .slice(0, 3)
    .map((r) => `# ${r.topic.title}\n${r.topic.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`)
    .join('\n\n');
  const userContent = `Role: ${role ?? 'unknown'}\nQuestion: ${question}\n\nSnippets:\n${snippets || '(none)'}`;
  try {
    if (provider === 'openai') {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return null;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: process.env.HELP_OPENAI_MODEL?.trim() || 'gpt-4o-mini',
          max_tokens: 300,
          temperature: 0,
          messages: [
            { role: 'system', content: AI_SYSTEM },
            { role: 'user', content: userContent },
          ],
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
      return finishSteps(data.choices?.[0]?.message?.content ?? '');
    }
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return null;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 300,
        temperature: 0,
        system: AI_SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type?: string; text?: string }[] };
    return finishSteps(data.content?.find((c) => c.type === 'text')?.text ?? '');
  } catch {
    return null;
  }
}

/**
 * Ask Me Anything. Any signed-in MIS user. Stored topics answer first (no AI);
 * one small AI call only when no topic is a confident match. Limits use the audit table (no migration).
 */
export async function askHelp(question: string): Promise<HelpAskResult> {
  const user = await requireMisAccess();
  const q = (question ?? '').trim().slice(0, HELP_QUESTION_MAX);
  if (!q) return { ok: false, reason: 'empty', message: 'Type a question first.' };

  try {
    const role = await getMisRole(user.id);
    const since = startOfToday();
    const asked = await db.misAuditLog.count({ where: { actorId: user.id, action: 'help.ask', createdAt: { gte: since } } });
    if (asked >= HELP_LIMIT_PER_USER_DAY) {
      return { ok: false, reason: 'rate_limited', message: 'You have asked a lot of questions today. Please try again tomorrow.' };
    }

    const audit = (answer: HelpAnswer) =>
      logAuditEvent({ actorId: user.id, action: 'help.ask', entity: 'help', after: { topicId: answer.topicId ?? null, source: answer.source } });

    const cacheKey = `${role ?? 'none'}|${normaliseQuestion(q)}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      await audit(cached);
      return { ok: true, answer: cached };
    }

    const provider = resolveAiProvider();
    const ranked = searchHelp(q, HELP_TOPICS);
    const hit = confidentHit(ranked);
    let answer: HelpAnswer;
    let cacheable = true;
    if (hit) {
      answer = buildAnswer(hit.topic, role, ranked);
    } else if (provider) {
      const aiWhere = { action: 'help.ask', createdAt: { gte: since }, after: { path: ['source'], equals: 'ai' } };
      const [mine, all] = await Promise.all([
        db.misAuditLog.count({ where: { ...aiWhere, actorId: user.id } }),
        db.misAuditLog.count({ where: aiWhere }),
      ]);
      if (mine >= HELP_AI_LIMIT_PER_USER_DAY || all >= HELP_AI_LIMIT_PER_DAY) {
        return { ok: false, reason: 'rate_limited', message: 'The smart answer limit is reached for today. Try the topic search words instead.' };
      }
      const steps = await askAi(provider, q, role, ranked);
      answer = steps
        ? { source: 'ai', title: 'Suggested answer', allowed: null, summary: 'This answer was written from the help topics. Please double check before acting.', steps, related: noneAnswer(role, ranked).related }
        : noneAnswer(role, ranked);
      if (!steps) cacheable = false; // a failed AI call should be retried, not remembered
    } else {
      answer = noneAnswer(role, ranked);
    }

    if (cacheable) cacheSet(cacheKey, answer);
    await audit(answer);
    return { ok: true, answer };
  } catch (error) {
    console.error('[mis-help] ask failed', { error: error instanceof Error ? error.message : 'unknown' });
    return { ok: false, reason: 'error', message: 'Something went wrong. Please try again.' };
  }
}
