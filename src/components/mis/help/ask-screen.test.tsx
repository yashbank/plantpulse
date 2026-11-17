import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HelpAnswer, HelpAskResult } from '@/lib/mis/help/types';

vi.mock('next/link', () => ({ default: ({ children, href, ...r }: { children: React.ReactNode; href: string }) => <a href={href} {...r}>{children}</a> }));
const askHelpAction = vi.fn<(q: string) => Promise<HelpAskResult>>();
vi.mock('@/app/(mis)/mis/help/actions', () => ({ askHelpAction: (q: string) => askHelpAction(q) }));

const { AskScreen } = await import('./ask-screen');

const base: HelpAnswer = {
  source: 'topic', topicId: 't1', title: 'Start a run', allowed: true, summary: 'Use the production screen.',
  steps: ['Open Production', 'Tap Start'], href: '/mis/production', related: [{ id: 'r1', title: 'Stop a run' }],
};
const ok = (a: Partial<HelpAnswer>): HelpAskResult => ({ ok: true, answer: { ...base, ...a } });
const chips = [{ id: 'a', title: 'How do I start a run?' }, { id: 'b', title: 'How do I mark attendance?' }];

beforeEach(() => {
  vi.clearAllMocks();
  window.sessionStorage.clear();
});

describe('AskScreen', () => {
  it('allowed answer: green status, numbered steps, open button', async () => {
    askHelpAction.mockResolvedValue(ok({}));
    render(<AskScreen role="OWNER" suggestions={chips} />);
    fireEvent.click(screen.getByRole('button', { name: 'How do I start a run?' }));
    expect(await screen.findByText('You can do this')).toBeTruthy();
    expect(askHelpAction).toHaveBeenCalledWith('How do I start a run?');
    expect(screen.getAllByRole('listitem').some((li) => li.textContent?.includes('Tap Start'))).toBe(true);
    expect(screen.getByRole('link', { name: 'Open screen' }).getAttribute('href')).toBe('/mis/production');
  });

  it('denied answer: amber status and no open button', async () => {
    askHelpAction.mockResolvedValue(ok({ allowed: false }));
    render(<AskScreen role="WORKER" suggestions={chips} />);
    fireEvent.click(screen.getByRole('button', { name: chips[0]!.title }));
    expect(await screen.findByText('Your role cannot do this')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Open screen' })).toBeNull();
  });

  it('none: friendly empty state', async () => {
    askHelpAction.mockResolvedValue(ok({ source: 'none', allowed: null, summary: '', steps: [], href: undefined, related: [] }));
    render(<AskScreen role="QC" suggestions={chips} />);
    fireEvent.click(screen.getByRole('button', { name: chips[0]!.title }));
    expect(await screen.findByText('No answer found')).toBeTruthy();
  });

  it('rate limited and error states', async () => {
    askHelpAction.mockResolvedValueOnce({ ok: false, reason: 'rate_limited', message: 'Slow down' });
    render(<AskScreen role="QC" suggestions={chips} />);
    fireEvent.click(screen.getByRole('button', { name: chips[0]!.title }));
    expect(await screen.findByText(/asking very fast/)).toBeTruthy();
    askHelpAction.mockResolvedValueOnce({ ok: false, reason: 'error', message: 'Boom' });
    fireEvent.click(screen.getByRole('button', { name: chips[1]!.title }));
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
  });

  it('shows Thinking while pending', async () => {
    let resolve!: (r: HelpAskResult) => void;
    askHelpAction.mockReturnValue(new Promise((r) => { resolve = r; }));
    render(<AskScreen role="QC" suggestions={chips} />);
    fireEvent.click(screen.getByRole('button', { name: chips[0]!.title }));
    expect(screen.getByText('Thinking...')).toBeTruthy();
    resolve(ok({}));
    await screen.findByText('You can do this');
  });

  it('Enter submits typed question, related chip re-asks, recent is stored', async () => {
    askHelpAction.mockResolvedValue(ok({}));
    render(<AskScreen role="OWNER" suggestions={[]} />);
    const f = screen.getByLabelText('Your question');
    fireEvent.change(f, { target: { value: 'hello there' } });
    fireEvent.submit(f.closest('form')!);
    await screen.findByText('You can do this');
    expect(askHelpAction).toHaveBeenCalledWith('hello there');
    fireEvent.click(screen.getByRole('button', { name: 'Stop a run' }));
    await waitFor(() => expect(askHelpAction).toHaveBeenLastCalledWith('Stop a run'));
    expect(JSON.parse(window.sessionStorage.getItem('mis.help.recent') ?? '[]')).toEqual(['Stop a run', 'hello there']);
  });

  it('caps input at 200 chars and refuses an empty ask', async () => {
    render(<AskScreen role="OWNER" suggestions={[]} />);
    const input = screen.getByLabelText('Your question') as HTMLInputElement;
    expect(input.maxLength).toBe(200);
    fireEvent.submit(input.closest('form')!);
    expect(askHelpAction).not.toHaveBeenCalled();
    expect(await screen.findByText('Type a question first.')).toBeTruthy();
  });

  it('slides carousel steps with next/prev', async () => {
    askHelpAction.mockResolvedValue(ok({ media: [{ kind: 'slides', src: ['/help/a.png', '/help/b.png'], alt: 'Demo' }] }));
    render(<AskScreen role="OWNER" suggestions={chips} />);
    fireEvent.click(screen.getByRole('button', { name: chips[0]!.title }));
    await screen.findByText('You can do this');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('img').getAttribute('src')).toBe('/help/b.png');
  });
});
