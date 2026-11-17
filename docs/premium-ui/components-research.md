# Premium UI components research

Date: 2026-11-16. Scope: copy-in components for the Next.js 16 / React 19 / Tailwind v4 MIS. No runtime animation library.

## 1. React Bits licence verdict

- Licence: **"MIT + Commons Clause License Condition v1.0"**, Copyright (c) 2026 David Haz (`LICENSE.md` in github.com/DavidHDev/react-bits; README: "free for personal and commercial use").
- Grant: use, copy, modify, merge, publish, distribute the Software **"as part of an application, website, or product"**.
- Key restriction: "You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves - whether alone, in a bundle, or as a ported version.**"
- Required: the copyright + permission notice "shall be included in all copies". Keep a one-line header comment in each copied file.
- Verdict: copying into a commercial client MIS is ALLOWED (it is "part of an application"). NOT allowed: shipping the components as a library, kit, template pack or port. Keep them inside the app repo. If the repo is ever handed to the client, that is delivery of an application, not resale of components; keep headers intact.
- Attribution line to keep in each file:
  `// Adapted from React Bits (https://reactbits.dev) - MIT + Commons Clause, (c) 2026 David Haz`
- Not legal advice; if the client repo is itself redistributed as a reusable template, get a lawyer's view.

## 2. Shortlist

Registry URL pattern: `https://reactbits.dev/r/<Name>-TS-TW.json` (also `-JS-TW`, `-TS-CSS`, `-JS-CSS`). JSON has `files[0].content` = source. Repo source lives under `src/` (the tailwind/ts variants); registry is the reliable fetch path. Fetched and checked all below on 2026-11-16 (HTTP 200). Reduced-motion = present in the source.

| # | Component | Use for us | Deps | CSS/JS | Touch | Reduced-motion | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | CountUp | KPI numbers count up | `motion` (framer) | JS | n/a | yes | ADAPT-AS-CSS/tiny: rewrite with rAF (~30 lines), skip `motion` |
| 2 | SpotlightCard | Glow card on KPI/summary tiles | none | JS (pointer var) + CSS | hover only; no-op on touch | yes | ADOPT (desktop only, tiny) |
| 3 | ShinyText | Shimmer on headings / loading text | none | JS state + CSS gradient | fine | yes | ADAPT-AS-CSS: pure CSS keyframe background-clip |
| 4 | GradientText | Brand-gradient title | none | CSS animated gradient | fine | yes | ADAPT-AS-CSS (static gradient default) |
| 5 | Counter | Odometer digits | none | JS | fine | yes | SKIP: heavy for value; CountUp is enough |
| 6 | BorderGlow / StarBorder | Premium border on primary card / CTA | none | CSS + small JS | fine | StarBorder yes, BorderGlow no | ADAPT-AS-CSS (StarBorder keyframe only, 1-2 uses) |
| 7 | GlareHover | Sheen on hover for cards/buttons | none | JS + CSS | hover only | yes | ADAPT-AS-CSS (:hover gradient sweep) |
| 8 | Magnet | Magnetic button | none | JS pointer | useless on touch | yes | SKIP: gimmick, no touch value |
| 9 | TiltedCard | 3D tilt | none | JS | no touch | yes | SKIP: image-card oriented, dashboard has no use |
| 10 | AnimatedContent / FadeContent | Scroll reveal / stagger | `gsap` + ScrollTrigger (~70 KB) | JS | fine | yes | ADAPT-AS-CSS: CSS `@starting-style`/IntersectionObserver + opacity/translate; no gsap |
| 11 | BlurText | Blur-fade headline | `motion` | JS | fine | yes | ADAPT-AS-CSS: one keyframe `blur-in` on page title only |
| 12 | AnimatedList | Staggered list | `@hugeicons/*`, JS heavy | JS | fine | yes | SKIP: CSS `animation-delay` via `--i` var does same |
| 13 | Aurora | Hero/login background | none listed (WebGL-style shader in source - verify, may need `ogl`) | JS canvas/GL | battery cost | yes | SKIP for dashboard; use static CSS radial-gradient mesh instead |
| 14 | Noise | Film grain overlay | none | canvas JS | battery cost | yes | ADAPT-AS-CSS: tiny SVG feTurbulence data-URI, static, 3-4% opacity |
| 15 | ClickSpark | Click particles | none | canvas JS | fine | yes | SKIP: distracting in work tool |

Notes: file sizes in the registry JSON include comments/boilerplate; real compiled sizes for no-dep items are ~1-3 KB each. Anything pulling `motion` (~30-50 KB) or `gsap` (~70 KB) fails the 3G budget; reimplement.

### Fetch paths for ADOPT / ADAPT items
- SpotlightCard: https://reactbits.dev/r/SpotlightCard-TS-TW.json (`SpotlightCard/SpotlightCard.tsx`)
- CountUp: https://reactbits.dev/r/CountUp-TS-TW.json (read logic, rewrite without `motion`)
- ShinyText: https://reactbits.dev/r/ShinyText-TS-TW.json
- GradientText: https://reactbits.dev/r/GradientText-TS-TW.json
- StarBorder: https://reactbits.dev/r/StarBorder-TS-TW.json
- GlareHover: https://reactbits.dev/r/GlareHover-TS-TW.json
- FadeContent / AnimatedContent: https://reactbits.dev/r/FadeContent-TS-TW.json, .../AnimatedContent-TS-TW.json (reference only, replace gsap)
- BlurText: https://reactbits.dev/r/BlurText-TS-TW.json (reference only)
- Noise: https://reactbits.dev/r/Noise-TS-TW.json (reference only; use SVG version)
- Attribution line (above) on every file derived from these, even when rewritten closely.

## 3. Also considered (licence-friendly, lightweight)

Licences from general knowledge; I did not re-verify each repo this session. Confirm LICENSE before copying.

| Source | Licence | Relevant lightweight patterns | Take? |
|---|---|---|---|
| Magic UI (magicui.design) | MIT | NumberTicker, BlurFade, ShimmerButton, BorderBeam, Marquee. Most use `motion` | Patterns only; CSS ones (ShimmerButton, BorderBeam) OK |
| shadcn/ui + blocks | MIT | Dashboard blocks, Skeleton, Sidebar | Yes for structure; Skeleton shimmer (CSS) |
| Tremor | Apache-2.0 (Tremor Raw copy-paste blocks MIT-style) | KPI cards, sparkline, progress bars | Layout ideas; Recharts dependency heavy |
| Aceternity UI | Free tier MIT-style; Pro is paid/restricted | Spotlight, glare card, many need `motion`/three | Free CSS-only ones only; skip Pro |
| Cult UI | MIT | Expandable cards, animated number | Reference only |
| Hover.dev | Free components; licence terms unclear/some Pro | Hover/glow effects | Skip unless licence confirmed |
| motionsites.ai | Commercial site/prompt templates, no clear open licence | Hero motion sites, not dashboards | SKIP: not relevant, licence unclear |

unsloth.ai: not researched (not UI).

## 4. Recommended adoption list (value per cost, max 10)

1. CSS `fade-up` stagger reveal (own keyframe + `--i` delay; replaces AnimatedContent/AnimatedList). ~0.3 KB. Reduced-motion media guard.
2. Skeleton shimmer (CSS keyframe; ShinyText idea). Perceived speed on 3G.
3. KPI count-up (rAF rewrite of CountUp, no `motion`). ~1 KB. Skip animation under reduced-motion.
4. SpotlightCard (adopt nearly verbatim; pointer-only, disable on `(hover: none)`). Premium card feel.
5. Subtle static background: CSS radial-gradient mesh + SVG-noise data-URI (Aurora/Noise look, zero JS).
6. GradientText for page/brand title only (CSS, static by default).
7. StarBorder-style CSS border sweep for 1-2 hero cards/primary CTA.
8. GlareHover as CSS `:hover` sheen on cards (desktop only).
9. BlurText as single `blur-in` keyframe on page title.
10. Press feedback: `active:scale-[0.98]` + transition (replaces Magnet/ripple; best for touch).

Rules: wrap all motion in `@media (prefers-reduced-motion: no-preference)`; gate hover effects in `@media (hover: hover)`; animate only `transform`/`opacity`; no `gsap`/`motion`/`three`/`ogl`.
