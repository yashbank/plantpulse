/**
 * Premium kit foundation: new props and components. Existing kit tests stay untouched.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/mis/orders' }));

import { Button } from './button';
import { Card } from './card';
import { CountUp } from './count-up';
import { PageHeader } from './page-header';
import { RouteProgress } from './route-progress';
import { SkeletonForm, SkeletonKpi } from './skeleton';
import { SpotlightCard } from './spotlight-card';
import { StatusBadge } from './status-badge';

afterEach(() => vi.unstubAllGlobals());

describe('Button', () => {
  it.each(['primary', 'go', 'secondary', 'danger', 'ghost'] as const)('%s keeps 44px, ripple and press', (variant) => {
    render(<Button variant={variant}>Go</Button>);
    const cls = screen.getByRole('button', { name: 'Go' }).className;
    expect(cls).toContain('min-h-11');
    expect(cls).toContain('mis-ripple');
    expect(cls).toContain('touch-manipulation');
  });

  it('loading disables, flags aria-busy and shows a spinner', () => {
    render(<Button loading>Save</Button>);
    const b = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
    expect(b.querySelector('.animate-spin')).not.toBeNull();
  });
});

describe('Card tone', () => {
  it('default is the unchanged flat neutral card', () => {
    render(<Card>body</Card>);
    const cls = screen.getByText('body').className;
    expect(cls).toContain('rounded-xl');
    expect(cls).toContain('bg-white');
    expect(cls).not.toContain('shadow-card');
  });

  it.each([
    ['action', 'bg-indigo-50'],
    ['warning', 'bg-amber-50'],
    ['danger', 'bg-red-50'],
    ['good', 'bg-emerald-50'],
    ['money', 'bg-indigo-50'],
    ['hero', 'from-indigo-600'],
  ] as const)('%s tone', (tone, expected) => {
    render(<Card tone={tone}>t-{tone}</Card>);
    expect(screen.getByText(`t-${tone}`).className).toContain(expected);
  });

  it('raised adds the shadow and 16px radius; onClick cards get press feedback', () => {
    const onClick = vi.fn();
    render(<Card raised onClick={onClick}>tap</Card>);
    const el = screen.getByRole('button', { name: 'tap' });
    expect(el.className).toContain('shadow-card');
    expect(el.className).toContain('rounded-2xl');
    expect(el.className).toContain('mis-press');
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalled();
  });
});

describe('StatusBadge', () => {
  it('renders the label with no dot by default', () => {
    const { container } = render(<StatusBadge tone="good">Done</StatusBadge>);
    expect(screen.getByText('Done')).toBeTruthy();
    expect(container.querySelector('[data-badge-dot]')).toBeNull();
  });
  it('dot adds an aria-hidden leading dot', () => {
    const { container } = render(<StatusBadge tone="critical" dot>Late</StatusBadge>);
    const dot = container.querySelector('[data-badge-dot]');
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
    expect(dot?.className).toContain('bg-red-500');
  });
  it('module chip uses the module tint and always shows its dot', () => {
    const { container } = render(<StatusBadge module="store">Store</StatusBadge>);
    expect(container.firstElementChild?.className).toContain('bg-amber-100');
    expect(container.querySelector('[data-badge-dot]')?.className).toContain('bg-amber-500');
  });
});

describe('Skeleton variants', () => {
  it('SkeletonKpi renders count cards and SkeletonForm label/input pairs', () => {
    const { container } = render(<><SkeletonKpi count={3} /><SkeletonForm fields={2} /></>);
    expect(container.querySelectorAll('.mis-skeleton')).toHaveLength(3 * 2 + 2 * 2);
  });
});

describe('PageHeader', () => {
  it('renders the title as h1, actions, meta, breadcrumbs and a back link to the parent', () => {
    render(
      <PageHeader
        title="Orders"
        meta="12 open"
        actions={<button type="button">New</button>}
        breadcrumbs={[{ label: 'Home', href: '/mis' }, { label: 'Orders' }]}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Orders' })).toBeTruthy();
    expect(screen.getByText('12 open')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New' })).toBeTruthy();
    const links = screen.getAllByRole('link', { name: 'Home' });
    expect(links).toHaveLength(2); // breadcrumb + phone back arrow
    expect(links.every((l) => l.getAttribute('href') === '/mis')).toBe(true);
  });
  it('has no back arrow without a target', () => {
    render(<PageHeader title="Solo" />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('CountUp', () => {
  it('SSR render shows the final value', async () => {
    const { renderToString } = await import('react-dom/server');
    expect(renderToString(<CountUp value={12345} />)).toContain('12,345');
  });
  it('shows the final value immediately under reduced motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    render(<CountUp value={250} format={(n) => `${n} pcs`} />);
    expect(screen.getByText('250 pcs')).toBeTruthy();
  });
  it('animates from 0 to the value when motion is allowed', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    render(<CountUp value={100} duration={500} />);
    expect(screen.getByText('0')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('100')).toBeTruthy();
    vi.useRealTimers();
  });
});

describe('SpotlightCard', () => {
  it('renders children and only lights up for a mouse pointer', () => {
    render(<SpotlightCard data-testid="spot"><p>KPI</p></SpotlightCard>);
    expect(screen.getByText('KPI')).toBeTruthy();
    const el = screen.getByTestId('spot');
    fireEvent.pointerMove(el, { pointerType: 'touch', clientX: 5, clientY: 5 });
    expect(el.hasAttribute('data-spot')).toBe(false);
    fireEvent.pointerMove(el, { pointerType: 'mouse', clientX: 5, clientY: 5 });
    expect(el.hasAttribute('data-spot')).toBe(true);
    fireEvent.pointerLeave(el);
    expect(el.hasAttribute('data-spot')).toBe(false);
  });
});

describe('RouteProgress', () => {
  it('renders nothing initially', () => {
    const { container } = render(<RouteProgress />);
    expect(container.firstChild).toBeNull();
  });
});
