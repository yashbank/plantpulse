import type { HelpTopic } from './types';

/**
 * Ask Me Anything: pure keyword search (BM25-style), no dependencies.
 * Handles English, Hindi (Devanagari) and Hinglish words by keeping every letter and mark.
 */

/** A top hit at or above this score AND the coverage below counts as a confident match: serve the stored topic, no AI. */
export const CONFIDENCE_MIN_SCORE = 1.5;
/** Share of the question's meaningful words that the top topic must contain. */
export const CONFIDENCE_MIN_COVERAGE = 0.6;

const K1 = 1.2;
const B = 0.75;
const W_TITLE = 3;
const W_KEYWORD = 2;
const W_STEP = 1;

const STOP = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'is', 'are', 'am', 'be', 'do', 'does', 'did', 'can', 'could', 'should', 'would',
  'i', 'me', 'my', 'we', 'you', 'your', 'it', 'this', 'that', 'how', 'what', 'where', 'when', 'which', 'who', 'please', 'and', 'or', 'with', 'from', 'by', 'will', 'want', 'need',
  // Hinglish / Hindi filler
  'kaise', 'kese', 'kya', 'kaha', 'kahan', 'kab', 'kon', 'kaun', 'karu', 'karun', 'kare', 'karen', 'karna', 'kar', 'ko', 'ka', 'ki', 'ke', 'me', 'mein', 'main', 'se', 'hai', 'hain', 'ho', 'hota', 'sakta', 'sakte', 'chahiye', 'mujhe', 'hum', 'aap', 'yeh', 'ye', 'woh', 'wo', 'par', 'pe', 'aur', 'toh', 'to',
  'कैसे', 'क्या', 'कहां', 'को', 'का', 'की', 'के', 'में', 'से', 'है', 'हैं', 'करना', 'करें', 'कर', 'मुझे', 'और', 'पर',
]);

/** Lowercase, strip punctuation, keep letters/digits/marks (Devanagari safe). */
export function normaliseText(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Very light stemmer: plural and common verb endings. Short words are left alone. */
export function stem(word: string): string {
  if (!/^[a-z]+$/.test(word) || word.length <= 3) return word;
  let w = word;
  if (w.endsWith('ies') && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith('sses')) w = w.slice(0, -2);
  else if (w.endsWith('ing') && w.length > 5) w = w.slice(0, -3);
  else if (w.endsWith('ed') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

/** Meaningful stemmed tokens of a text (stop words removed). */
export function tokenise(input: string): string[] {
  return normaliseText(input)
    .split(' ')
    .filter((t) => t && !STOP.has(t))
    .map(stem);
}

/** Cache key form of a question: the same words in the same order always give the same string. */
export function normaliseQuestion(input: string): string {
  return tokenise(input).join(' ');
}

export type RankedTopic = { topic: HelpTopic; score: number; coverage: number };

type Doc = { topic: HelpTopic; tf: Map<string, number>; len: number };

function buildDoc(topic: HelpTopic): Doc {
  const tf = new Map<string, number>();
  let len = 0;
  const add = (text: string, weight: number) => {
    for (const t of tokenise(text)) {
      tf.set(t, (tf.get(t) ?? 0) + weight);
      len += weight;
    }
  };
  add(topic.title, W_TITLE);
  for (const k of topic.keywords) add(k, W_KEYWORD);
  for (const s of topic.steps) add(s, W_STEP);
  return { topic, tf, len };
}

/** Ranked topics with score > 0, best first. Ties keep the authored order. */
export function searchHelp(question: string, topics: readonly HelpTopic[]): RankedTopic[] {
  const q = [...new Set(tokenise(question))];
  if (q.length === 0 || topics.length === 0) return [];
  const docs = topics.map(buildDoc);
  const n = docs.length;
  const avg = docs.reduce((s, d) => s + d.len, 0) / n || 1;
  const idf = new Map<string, number>();
  for (const t of q) {
    const df = docs.filter((d) => d.tf.has(t)).length;
    idf.set(t, Math.log(1 + (n - df + 0.5) / (df + 0.5)));
  }
  const out: RankedTopic[] = [];
  docs.forEach((d) => {
    let score = 0;
    let hit = 0;
    for (const t of q) {
      const f = d.tf.get(t);
      if (!f) continue;
      hit += 1;
      score += (idf.get(t) ?? 0) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.len) / avg)));
    }
    if (score > 0) out.push({ topic: d.topic, score, coverage: hit / q.length });
  });
  return out
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.score - a.r.score || a.i - b.i)
    .map((x) => x.r);
}

/** The top hit when it is strong enough to answer without AI. */
export function confidentHit(ranked: readonly RankedTopic[]): RankedTopic | null {
  const top = ranked[0];
  if (!top) return null;
  return top.score >= CONFIDENCE_MIN_SCORE && top.coverage >= CONFIDENCE_MIN_COVERAGE ? top : null;
}
