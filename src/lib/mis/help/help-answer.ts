import { can } from '../permissions';
import type { MisRoleName } from '../roles';
import type { RankedTopic } from './help-search';
import type { HelpAnswer, HelpTopic } from './types';

/** Does this role hold every permission the topic needs? requires null means any signed-in role. */
export function roleCanDo(topic: HelpTopic, role: MisRoleName | null): boolean {
  if (topic.requires === null) return true;
  return topic.requires.every((a) => can(role, a));
}

/**
 * Turn a stored topic into the answer for one role.
 * Not allowed: no steps and no link, so we never point at a screen the role cannot open.
 * `ranked` is the search result; related = next 2 topics (other than this one) the role can do.
 */
export function buildAnswer(topic: HelpTopic, role: MisRoleName | null, ranked: readonly RankedTopic[] = []): HelpAnswer {
  const allowed = roleCanDo(topic, role);
  const note = role ? topic.roleNotes?.[role] : undefined;
  const base = allowed ? 'You can do this.' : `Your role cannot do this. ${topic.whoCan}`;
  const related = ranked
    .filter((r) => r.topic.id !== topic.id && roleCanDo(r.topic, role))
    .slice(0, 2)
    .map((r) => ({ id: r.topic.id, title: r.topic.title }));
  return {
    source: 'topic',
    topicId: topic.id,
    title: topic.title,
    allowed,
    summary: note ? `${base} ${note}` : base,
    steps: allowed ? [...topic.steps] : [],
    ...(allowed && topic.href ? { href: topic.href } : {}),
    ...(allowed && topic.media ? { media: topic.media } : {}),
    related,
  };
}
