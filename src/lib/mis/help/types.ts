import type { MisAction } from '../permissions';
import type { MisRoleName } from '../roles';

export type HelpMedia = {
  kind: 'image' | 'gif' | 'video' | 'slides';
  /** One path under /help/... for image, gif and video; several for slides. */
  src: string | string[];
  alt: string;
};

/** One how-to the platform can explain. Authored once in help-content.ts; no AI needed to serve it. */
export type HelpTopic = {
  id: string;
  title: string;
  /** Extra words people type for this task (synonyms, Hinglish, short forms). */
  keywords: string[];
  /** Permissions needed to DO the task. All must be held. null means any signed-in MIS role. */
  requires: MisAction[] | null;
  /** Who can do it, in plain words, for the "you cannot, ask ..." answer. */
  whoCan: string;
  /** 3 to 6 short imperative steps. */
  steps: string[];
  /** Screen that does the task. Must be a real /mis route. */
  href?: string;
  roleNotes?: Partial<Record<MisRoleName, string>>;
  media?: HelpMedia[];
};

export type HelpAnswer = {
  /** topic: served from stored content, ai: short model answer, none: no match. */
  source: 'topic' | 'ai' | 'none';
  topicId?: string;
  title: string;
  /** true: this user may do it. false: may not. null: not a permission question. */
  allowed: boolean | null;
  summary: string;
  steps: string[];
  href?: string;
  media?: HelpMedia[];
  related: { id: string; title: string }[];
};

export type HelpAskResult =
  | { ok: true; answer: HelpAnswer }
  | { ok: false; reason: 'rate_limited' | 'empty' | 'error'; message: string };
