# Premium kit: how to use it (rollout cheat sheet)

Import everything from `@/components/mis/kit`. Spec: `design-spec.md`. Tokens: `--mis-*` in globals.css (`.mis-light`).
Rules: tokens/Tailwind theme colours only; motion is CSS transform/opacity; hover inside `@media (hover:hover)`; 44px targets, 48px inputs.

- **Button**: `variant` primary | go (start/approve) | secondary | danger | ghost; `loading`; `block`. Ripple, press scale and primary sheen are built in. One primary per screen.
- **Card**: `<Card>` unchanged (flat, 12px radius). `raised` = shadow + 16px radius (use for KPI/summary). `tone` = action | warning | danger | good | money | hero
  (tone implies the 16px radius; hero = 20px, ONE per screen; money only for OWNER, never render it for others). `onClick` gives press feedback;
  `interactive` (explicit) also adds hover lift for cards that wrap a link.
- **SpotlightCard**: raised KPI tile with a mouse-only glow. Use for dashboard KPI tiles, not for lists.
- **CountUp**: `<CountUp value={n} decimals format />` for KPI numbers. Final value in SSR and under reduced motion. Never use for money text that must be copy-exact mid-animation (pass `duration={0}`).
- **StatusBadge**: `tone`, optional `dot`; `module="production|quality|store|people|purchasing"` for module chips (text stays slate, accent is the dot only).
- **Skeleton**: match the real layout: `SkeletonList` (rows), `SkeletonTable`, `SkeletonKpi` (count), `SkeletonDetail`, `SkeletonForm` (fields). Max 12 shimmering blocks on phones.
- **PageHeader**: `title` (h1), `breadcrumbs` (>= lg), back arrow on phone (`backHref`/`backLabel`, or the last linked crumb), `meta`, `actions` (1 primary + overflow). `gradient` for ONE title.
- **EmptyState**: `title`, `body`, `action`, optional `icon`. Never leave a blank list.
- **Tabs**: sliding 2px indicator (transform). **FilterBar**: `sticky`, `resultCount` (aria-live) opt-ins. **SlideOver**: 260ms enter, 20px radius, no change in API.
- **DataTable**: unchanged API. Pointer-only row tint, touch press tint, `content-visibility` on mobile cards when > 30 rows.
- **RouteProgress**: mounted once in `MisShell`; do not mount again.

## CSS helpers (globals.css)
`.mis-press` (press scale + tint on :active) | `.mis-ripple` (+ `.mis-ripple-fill` on filled) | `.mis-sheen` | `.mis-spot` | `.mis-lift` (hover lift) |
`.mis-rise` (stagger, first viewport) | `.mis-page-enter` (on `<main>`, already applied) | `.mis-wash` (page gradient + noise, phone shell has it) |
`.mis-skeleton` | `.mis-cv` (long lists) | `.mis-gradient-text` | `.mis-progress`.

## Don'ts
No framer-motion/gsap. No new hex. No animating width/height/margin. No hover effect outside `@media (hover:hover)` (Tailwind `hover:` already is).
React Bits derived files keep the header `// Adapted from React Bits (https://reactbits.dev) - MIT + Commons Clause, (c) 2026 David Haz`.
