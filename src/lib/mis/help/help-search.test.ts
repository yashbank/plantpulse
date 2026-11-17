import { describe, expect, it } from 'vitest';

import { HELP_TOPICS } from './help-content';
import { confidentHit, normaliseQuestion, normaliseText, searchHelp, stem } from './help-search';
import type { HelpTopic } from './types';

const T = (id: string, title: string, keywords: string[], steps: string[]): HelpTopic => ({ id, title, keywords, requires: null, whoCan: 'x', steps });

const FIX: HelpTopic[] = [
  T('assign', 'Assign an employee to a machine', ['allocate worker', 'machine pe worker lagao', 'operator'], ['Open the machine board', 'Pick the employee']),
  T('leave', 'Apply for leave', ['chutti', 'holiday'], ['Open Me', 'Tap leaves']),
  T('grn', 'Receive goods against a purchase order', ['GRN', 'maal aaya'], ['Open GRN', 'Enter quantities']),
];

describe('normalise and stem', () => {
  it('lowercases and strips punctuation, keeps Hindi', () => {
    expect(normaliseText('  Hello, WORLD!! कैसे?  ')).toBe('hello world कैसे');
  });
  it('stems plurals and verb endings', () => {
    expect(stem('machines')).toBe(stem('machine'));
    expect(stem('assigning')).toBe(stem('assigned'));
  });
  it('same question key regardless of filler and punctuation', () => {
    expect(normaliseQuestion('How do I assign an employee?')).toBe(normaliseQuestion('assign employee'));
  });
});

describe('searchHelp', () => {
  it('supervisor-style English query ranks the assignment topic first and is confident', () => {
    const r = searchHelp('how do I assign an employee to a machine', FIX);
    expect(r[0]?.topic.id).toBe('assign');
    expect(confidentHit(r)?.topic.id).toBe('assign');
  });
  it('Hinglish query matches via keywords', () => {
    expect(searchHelp('machine pe worker kaise lagao', FIX)[0]?.topic.id).toBe('assign');
    expect(searchHelp('chutti kaise le', FIX)[0]?.topic.id).toBe('leave');
  });
  it('gibberish gives no hits and no confidence', () => {
    const r = searchHelp('zzzz qqqq', FIX);
    expect(r).toEqual([]);
    expect(confidentHit(r)).toBeNull();
  });
  it('a weak partial match is not confident', () => {
    expect(confidentHit(searchHelp('quarterly tax filing for machine', FIX))).toBeNull();
  });
  it('empty question or topics returns nothing', () => {
    expect(searchHelp('   ', FIX)).toEqual([]);
    expect(searchHelp('assign', [])).toEqual([]);
  });
  it('works against the shipped content export', () => {
    expect(Array.isArray(HELP_TOPICS)).toBe(true);
    expect(HELP_TOPICS.length).toBeGreaterThan(0);
  });
});
