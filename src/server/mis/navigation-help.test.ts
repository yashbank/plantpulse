import { describe, expect, it, vi } from 'vitest';

import { MIS_ROLES } from '@/lib/mis/roles';

vi.mock('@/server/mis/roles', () => ({ getMisRole: vi.fn() }));
const { navigationForRole, splitNavigation, MAX_PRIMARY_NAV } = await import('./navigation');

describe('Ask me nav entry', () => {
  it.each(MIS_ROLES)('%s sees it on the desktop, as a non-primary tab', (role) => {
    const entry = navigationForRole(role, 'desktop').find((e) => e.id === 'help');
    expect(entry).toMatchObject({ href: '/mis/help', labelKey: 'nav.help', primary: false });
    expect(splitNavigation(navigationForRole(role)).primary.length).toBeLessThanOrEqual(MAX_PRIMARY_NAV);
  });
  it.each(['OWNER', 'ADMIN', 'SUPERVISOR'] as const)('%s sees it in the phone More sheet', (role) => {
    expect(navigationForRole(role, 'phone').some((e) => e.id === 'help')).toBe(true);
  });
  it('a signed-out role gets nothing', () => {
    expect(navigationForRole(null).some((e) => e.id === 'help')).toBe(false);
  });
});
