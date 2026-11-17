# MIS Premium UI - Design Spec (light first, dark-ready)

Scope: one visual system for every role and screen. Tokens: `docs/premium-ui/design-tokens.css`
(`--mis-*`, Tailwind theme vars only, no new hex). Builds on the existing `.mis-light` block and the
"MIS premium layer (pilot)" in `src/app/globals.css` (`.mis-action`, `.mis-lift`, `.mis-rise`,
`.mis-row-trigger`, `.mis-menu-item`). The pilot is the reference; this spec generalises it.
Direction (Linear / Vercel / Stripe dashboards, reactbits-style polish): quiet neutral surfaces, one
indigo accent, hairline borders, soft layered shadows, tabular numerals, motion that confirms an action
and never decorates. Research was done from known patterns, not live fetches.

## 1. Surfaces, borders, radii
| Level | Token | Use | Classes |
|---|---|---|---|
| Page | `--mis-page` (+ optional `--mis-page-wash`) | app background | `bg-slate-50`; add `.mis-wash` on a page container for the aurora (static radial gradient, no blur/animation) |
| Card | `--mis-card`, `--mis-border`, shadow-1 | default panel, list row group | `rounded-2xl border border-slate-200 bg-white shadow-card` |
| Raised | shadow-2 | menus, sticky bars, toast, hovered card | `shadow-elevated` |
| Hero | `--mis-hero` gradient, `--mis-r-hero` | ONE per screen: the card that unblocks work (spec 4.2 "Action") | `rounded-[1.25rem] text-white shadow-float` |
| Overlay | `--mis-overlay` | slide-over/sheet backdrop | no backdrop-blur on phones |
- Border: 1px `--mis-border`. Strong (`--mis-border-strong`) only for inputs and secondary buttons.
- Glow: `--mis-glow` is for focus/active-selection only, never as decoration. Hover border: `--mis-border-hover`.
- Dashed border = "never recorded" (keep MIS_UI_SPEC 4.4 rule 6).
- Radii: chip 9999, control 12px, card 16px, hero/slide-over 20px. No other radii. Replace `rounded-lg`/`rounded-xl` drift.
- Semantic tone cards keep MIS_UI_SPEC 4.2 recipes (`bg-X-50 border-X-200`), now on `--mis-*-bg/-line`.

## 2. Colour roles (all text pairs >= WCAG AA 4.5:1, labels >= 12px)
- Primary: indigo-600 fill, white text (6.3:1); hover indigo-700; tint indigo-50/200 for "waiting on you".
- Success emerald-700 on emerald-50; Warning amber-900 on amber-50; Danger red-700 on red-50; Info sky-800 on sky-50.
- Money (OWNER only): `--mis-money` indigo-800 on indigo-50 plus the lock label. Values and visibility rules unchanged;
  styling must never be rendered for non-owners (absent, not greyed).
- Ink: slate-900 text, slate-600 secondary, slate-500 labels only. Never slate-400 for readable text (decorative icons only).
- Module accents (small dot 8px or 20px icon chip only, text stays slate-900): Production indigo-500, Quality emerald-500,
  Store amber-500, People sky-500, Purchasing violet-500. Never as card fill, never as series colour.
  Green/amber/red stay reserved for state (MIS_UI_SPEC 3, charts).
- State is never colour alone: label or icon always present (StatusBadge already enforces).

## 3. Typography
| Role | Class | Notes |
|---|---|---|
| KPI number | `font-mono text-4xl font-bold tabular-nums tracking-tight` | same as widgets.tsx; unit `text-sm font-medium text-slate-500` |
| Page title | `text-2xl font-bold tracking-tight text-slate-900` | one per screen |
| Section title | `text-lg font-semibold text-slate-900` | |
| Body | `text-base text-slate-900`; inputs 16px | |
| Small/meta | `text-sm text-slate-600` | |
| Label | `text-[11px] font-semibold uppercase tracking-wider text-slate-500` | |
| Code/ID | `font-mono text-xs text-slate-500` | |
- All numbers in tables/KPIs/money: `tabular-nums`, right-aligned in tables. Max 2 weights per card (600 + 400).

## 4. Motion
- Easing: ONE curve `--mis-ease` = cubic-bezier(0.2,0.8,0.2,1). Durations: 120 press/tint/colour; 180 hover, menu, toast;
  260 slide-over, sheet, lift; 380 page enter/hero. Nothing else.
- Animate `transform` and `opacity` only (colour/background/box-shadow transitions on small elements allowed). No width/height/top/left/margin animation.
  No `backdrop-filter` on large areas or on phones. Use `will-change` never, except the progress bar.
- Stagger: children of a list/grid get `.mis-rise` with 40ms steps, max 6 steps (rest share the last delay). Only first viewport; never on re-render/filter.
- Page enter: wrapper `animation: mis-page-in var(--mis-d-enter) var(--mis-ease) both` (opacity + 8px translateY). Route change: 2px indigo-600
  top bar, `mis-progress` translateX loop 900ms linear, shown after 150ms of pending navigation (skip fast routes), fades out 180ms.
- Skeleton shimmer: pseudo-element sweep `mis-shimmer-x` (transform only), 1.4s, slate-100 to slate-50. Replace background-position shimmer.
- Hover (pointer devices only, wrap in `@media (hover:hover)`): card lift -2px + shadow-3 + `--mis-border-hover`; row tint indigo 4%; button -1px.
- Press (touch, `:active`): `scale(.98)` for 120ms + `--mis-press-tint` overlay on rows/cards; buttons add ripple (radial pseudo-element
  scaled 0 to 1 with opacity, 260ms, tinted white 25% on filled, indigo 10% on quiet). Min target 44x44px (`min-h-11 min-w-11`); 48px inputs.
  Touch feedback must appear within one frame (no delay; no 300ms tap wait: `touch-action: manipulation`).
- Focus-visible: `outline 2px var(--mis-ring)`, offset 2px, plus `--mis-glow` on inputs. Never remove outline.
- Reduced motion: the tokens file zeroes durations; also every keyframe/transform rule sits under
  `@media (prefers-reduced-motion: reduce)` -> `animation:none; transition:none; transform:none`. Progress bar becomes static 2px bar.

## 5. Component recipes
- KPI card: `Card` raised on hover (`.mis-lift` only if clickable). Label (label type) / value (KPI type) / delta chip (StatusBadge, tone) /
  sparkline (SVG, one series hue) / note `text-xs text-slate-500`. Skeleton: label bar h-3 w-20, value bar h-9 w-28.
- List row (phone) / table row (desktop): row min-h-14 (touch), `border-b border-slate-100`, hover tint (pointer only), press tint (touch).
  Primary text 600, meta `text-sm text-slate-600`, status at right via StatusBadge, row-actions at far right. Long lists: `content-visibility:auto; contain-intrinsic-size: auto 56px`.
- Row actions: ONE main action (`.mis-action .mis-action-primary|go|quiet`, min-h 44) + ONE three-dot `.mis-row-trigger` (44px, ghost until row hover on pointer devices, always visible on touch) opening the fixed menu with `.mis-menu-item` (180ms). Destructive item last, red-700, with separator.
- Buttons: primary `bg-indigo-600 text-white`, secondary `border-slate-300 bg-white text-slate-900`, danger `bg-red-600 text-white` (confirm dialog required),
  ghost. All `min-h-11 rounded-xl px-4 text-base font-medium`, loading spinner, disabled opacity .55, `active:scale-[.98]`. Hero/primary may use `.mis-action-primary` gradient; pick ONE style per screen.
- Filter bar: sticky under header, `bg-white/95` (no blur), chips 44px tall, search 48px, active chip `bg-indigo-50 border-indigo-200 text-indigo-800`; result count `aria-live=polite`.
- Tabs: underline style, 44px, active `text-indigo-700` with 2px indigo-600 indicator sliding via `transform: translateX` (180ms).
- Empty state: dashed card (`border-dashed border-slate-300 bg-slate-50/60`), 20px slate-300 icon, one line of what + one primary action. Never blank.
- Loading skeleton per layout: List = 4-6 x `h-16 rounded-2xl`; Table = header h-10 + 5 rows; KPI grid = N cards (label+value bars); Detail = title bar + 2 cards; Form = label/input pairs h-12. Match the real layout's heights so there is zero shift (CLS 0). Max 12 shimmering blocks on phones.
- Toast: reuse `components/ui/toast`; raised, `rounded-xl`, left 3px state bar, enters translateY(8px)+opacity 180ms, auto-dismiss 4s (errors stay), bottom above bottom bar on phone.
- Slide-over: `SlideOver`; panel `rounded-l-[1.25rem]` (sheet: top radius 20px), enter translateX/translateY 260ms, backdrop opacity 260ms, focus trap kept, sticky footer with primary + secondary.
- Status badge: keep `StatusBadge` tones; add optional 6px leading dot; `text-sm font-medium ring-1 ring-inset`. Module chip = same shape with `--mis-mod-*-bg` and dot.
- Page header: breadcrumbs `text-xs text-slate-500` (>=lg only, collapse to back arrow on phone) / title (page title type) + meta / right-aligned actions (max 1 primary + overflow menu). Sticky on phone, 56px.
- Bottom bar: fixed, `bg-white border-t border-slate-200`, safe-area padding (`pb-[env(safe-area-inset-bottom)]`), 5 items, `min-h-14`, active = indigo-600 icon + semibold label + 2px top indicator (transform), badge indigo-600, press = tint + scale .96 on icon only. No blur.

## 6. Role groups (same chrome, same tokens; only content differs)
- Owner/Admin: dashboard widgets, approvals, orders, reports, masters. Heaviest on KPI cards, DataTable, filter bars, slide-overs, money (Owner only). Desktop-first, tablet ok.
- Supervisor/QC/Production: home hero ("+ Record production" / "Start the 10:00 check"), machine grid, hourly slot grid, sign-off lists. Phone + gloves: 48px+ targets, press feedback is the main affordance.
- Store/Purchasing: search/scan bar, cart stepper, GRN/issue lists, stock health. Footer sticky primary. Purchasing accent chips only.
- Attendance/Crew/People: registers, kiosk health, late lists, corrections (dashed indigo cards). Dense lists: row recipe + `content-visibility`.
- Worker/phone: fewest elements, biggest targets, 420px column (`max-w-[420px]`), bottom bar always.
- Must be IDENTICAL everywhere: page header, hero card slot (one), card/row/button recipes, radii, badge tones, empty/skeleton/toast/slide-over, focus ring, press feedback, bottom bar, motion tokens, number styling.
  Allowed to differ: widgets chosen, density (row height 56 vs 44 on >=lg tables), accent dot per module.

## 7. Performance budget
- No new runtime JS dependency > 5 KB gz (prefer none: CSS-only motion; no framer-motion/GSAP). Total added CSS <= 6 KB gz.
- <= 30 concurrently animating elements on phones (shimmer <= 12, stagger <= 6 steps, first viewport only). Pause shimmer when offscreen is not needed if <= 12.
- Animate transform/opacity only; no layout-affecting animation; no `backdrop-filter`/large blur/box-shadow animation on phones (shadow changes only on hover, pointer devices).
- `content-visibility:auto` + `contain-intrinsic-size` for lists > 30 rows, `contain: layout paint` on cards in long grids. Virtualise > 200 rows.
- Gradients/aurora are static CSS (no images, no canvas, no SVG filters). Fonts: existing Geist only, `font-display: swap`.
- INP < 200 ms: press feedback is CSS `:active`, never JS state. LCP: no entrance animation on the LCP element's first paint longer than 380 ms; skeletons match size (CLS < 0.05).
- Respect `prefers-reduced-motion`, `prefers-reduced-data` (drop wash gradient), and `@media (hover:hover)` for all hover effects.
- Gate: Lighthouse mobile perf >= 85 on Owner dashboard and a 100-row list; existing tests (tap-targets-kit, button, data-table) stay green.

## 8. Implementation order (builder)
1. `src/app/globals.css`: paste `design-tokens.css` into `.mis-light`; add keyframes; add reduced-motion + `@media (hover:hover)` wrappers; convert pilot `.mis-lift:hover`, `tbody tr:hover` to hover-only; add `.mis-press` (scale .98 + tint on `:active`), `.mis-ripple`, `.mis-wash`, `.mis-progress`, new transform-based `.mis-skeleton`.
2. `kit/button.tsx`: use `--mis-*` radius/ease, ripple span, press tint; keep `min-h-11`, variants, `loading`. Fold `.mis-action` into it (variants map: primary, go, quiet).
3. `kit/card.tsx`: add `tone` (neutral|action|warning|danger|good|money|hero), `raised`, `rounded-2xl`, press tint when interactive.
4. `kit/skeleton.tsx`: shimmer via transform; add `SkeletonKpi`, `SkeletonDetail`, `SkeletonForm`.
5. `kit/status-badge.tsx`: dot option + module chip variant (`module` prop).
6. `kit/row-actions.tsx` + `kit/data-table.tsx`: one main action + trigger; hover-only tint; `content-visibility` rows; sticky header shadow.
7. `kit/empty-state.tsx`, `kit/filter-bar.tsx`, `kit/tabs.tsx`, `kit/slide-over.tsx`: recipes in section 5 (indicator transform, 260 ms enter).
8. `kit/page-header.tsx` (new): breadcrumbs, title, actions; adopt in each screen; add `kit/route-progress.tsx` (new, ~1 KB, CSS animation) mounted in `shell/mis-shell.tsx`; page-enter wrapper in `<main>`.
9. `shell/bottom-nav.tsx` + `mis-shell.tsx`: indicator, safe-area, press feedback, wash background.
10. `desktop/widgets.tsx` + `dashboard-screen.tsx`: switch to kit KPI card (extract `KpiCard` into kit), `.mis-rise` stagger. Then roll out by role: Supervisor/QC home, Store, Attendance, Admin lists, Owner approvals/reports.
11. Verify: `pnpm lint && pnpm typecheck && pnpm test`; manual check on 360px, reduced-motion on, 4x CPU throttle.
