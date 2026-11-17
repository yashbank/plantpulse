import { can } from '../permissions';
import type { MisRoleName } from '../roles';
import type { HelpTopic } from './types';

/**
 * Suggestion chips for the Ask screen: topics this role can actually do come first,
 * then the rest, in authored order. Pure; pass HELP_TOPICS from help-content.ts.
 */
export function suggestedTopics(
  role: MisRoleName | null,
  n: number,
  topics: readonly HelpTopic[],
): { id: string; title: string }[] {
  const doable = (t: HelpTopic) => t.requires === null || t.requires.every((a) => can(role, a));
  const ordered = [...topics.filter(doable), ...topics.filter((t) => !doable(t))];
  return ordered.slice(0, Math.max(0, n)).map(({ id, title }) => ({ id, title }));
}
