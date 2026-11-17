import { describe, expect, it } from 'vitest';

import { suggestedTopics } from './suggestions';
import type { HelpTopic } from './types';

const topic = (id: string, requires: HelpTopic['requires']): HelpTopic => ({
  id, title: `T ${id}`, keywords: [], requires, whoCan: 'x', steps: ['a'],
});
const TOPICS = [topic('pay', ['wages.read']), topic('any', null), topic('qc', ['qc.read']), topic('ord', ['orders.read'])];

describe('suggestedTopics', () => {
  it('puts topics the role can do first, keeps authored order, caps at n', () => {
    expect(suggestedTopics('QC', 2, TOPICS).map((t) => t.id)).toEqual(['any', 'qc']);
    expect(suggestedTopics('QC', 6, TOPICS).map((t) => t.id)).toEqual(['any', 'qc', 'ord', 'pay']);
  });
  it('still returns topics the role cannot do when few are doable', () => {
    expect(suggestedTopics('WORKER', 3, TOPICS)).toHaveLength(3);
  });
  it('handles n <= 0 and null role', () => {
    expect(suggestedTopics('OWNER', 0, TOPICS)).toEqual([]);
    expect(suggestedTopics(null, 1, TOPICS)[0]?.id).toBe('any');
  });
});
