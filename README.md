# MIW — My Invention World

The site of MIW, a team of seven in Prague that builds websites, online stores and automation for
small businesses, MVPs and AI features for startups, and its own products. The home page is one
continuous camera flight: you leave Earth orbit, pass four stations — startups, small businesses,
our products, the team — and arrive at the contact console. `/work` and `/about` are plain pages.

There is exactly one element on the page with real height. Everything else is fixed, and scroll
is a timeline rather than a layout.

---

## Requirements

| | |
|---|---|
| Node.js | 20.9+ (built on v26.3.0) |
| npm | 10+ (built on 11.16.0) |
| Browser | Any with WebGL 2 (Chrome, Safari 16+, Firefox, Edge) |

A discrete or modern integrated GPU is recommended. Browsers without WebGL, or whose WebGL is
drawn in software (no GPU, as in headless Chrome), get the flat page instead, as do touch screens.

---

## Running it

```bash
git clone git@github.com:myinventionworld/MIW-page.git
cd MIW-page
npm install

npm run dev      # development, http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

Scroll slowly the first time. The runway is nine viewport heights.

`/` redirects to a locale, so the first page you land on is `/en`, `/ru` or `/cs` depending on
your `Accept-Language`. See [Languages](#languages).

### Dependencies

| Package | Role |
|---|---|
| `three` | WebGL renderer, geometry, and the `ShaderMaterial` every visual is built on |
| `@react-three/fiber` | React reconciler for three.js; provides the `useFrame` render loop |
| `@react-three/drei` | `Environment` / `Lightformer` studio rig, `PerformanceMonitor` |
| `@react-three/postprocessing` + `postprocessing` | Bloom, chromatic aberration, vignette, grain, AgX tone mapping |
| `lenis` | Smooth scroll driving *real* window scroll, so `useScroll` still works |
| `motion` | MotionValue-driven overlay animation that never re-renders React |
| `clsx` + `tailwind-merge` | The `cn()` class merge helper |
| `i18next` + `react-i18next` | Translation lookup, server and client |
| `next-i18n-router` | Locale detection and the `/` → `/en` redirect, run from `proxy.ts` |
| `@i18nexus/cli` | Pulls translated JSON down from i18nexus (dev dependency) |
| `@vercel/analytics` | Vercel Web Analytics: page views, no cookies |
| `playwright` | The CI smoke test (dev dependency) |

Tailwind v4 is configured entirely in `app/globals.css` via `@theme`, including the colour
palette and the type scale (`text-label` … `text-heading-xl`). Change sizes there, not in
components. There is no `tailwind.config.*`.

### CI

`.github/workflows/ci.yml` runs on every push and pull request to `redesign/product` and `master`:
`npm ci`, `next typegen` + `tsc --noEmit`, `next build`, then `next start` and a Playwright smoke test,
`scripts/ci/smoke.mjs`. The smoke test fails the run if any page in any language answers
anything but 200 (robots.txt and sitemap.xml included), if a page throws, or if a page scrolls
sideways at 320 or 390 px. Screenshots of the main pages, desktop and phone, are attached to the
run as the `smoke-screenshots` artifact.

`.github/workflows/pr-title.yml` fails a pull request whose title is not
`type(scope): summary`, as in [CONTRIBUTING.md](CONTRIBUTING.md). It runs again when the title
is edited.

Dependabot (`.github/dependabot.yml`) opens a pull request into `redesign/product` every
Monday: minor and patch updates of npm packages together, each major on its own, and the
GitHub Actions in one more. Their titles start with `chore(deps):`. CI runs on each of them.

To run it locally against your own build, with the Chrome you already have:

```bash
npm run build && npm run start
SMOKE_CHANNEL=chrome node scripts/ci/smoke.mjs
```

---

## Project structure

The code is cut into vertical slices. Each folder under `modules/` is one part of the site, with
its components, data, hooks and server code side by side, and a public entry (`index.ts`, plus
`server.ts` for what must stay on the server, so a client file can import `index.ts` safely). Routes in `app/` are thin: they read
params, set metadata and compose modules.

```
proxy.ts                   Locale detection and redirect (this Next version has no middleware)
locales/en|ru|cs/*.json    Every word on the site: common, stations, projects, console, about

app/                       Routes only
  [locale]/layout.tsx      Fonts, TranslationsProvider, cookie banner, light veil
  [locale]/page.tsx        Renders <Experience />
  [locale]/work/           Case study index and [slug]
  [locale]/about/          Team, what we do, how we work
  [locale]/terms/          Terms of use
  sitemap.ts robots.ts llms.txt/
  globals.css              @theme tokens, .panel / .drawer / .copy-scrim / .field / .range

modules/
  home/                    The scroll flight
    experience.tsx         Lenis root, scroll bridge, overlay stack, scroll runway
    navbar.tsx             Fixed glass header, sliding nav pill, mega-menu drawer
    project-dock.tsx       Station brief + docked project card with prototype frame
    transmission-console.tsx  The contact console at the end of the flight
    fallback.tsx           The flat page: touch screens, no GPU
    stage.tsx              Scroll-window primitive
    stations.ts            The four stations, their scroll anchors, the header sections
    flight.ts              Shared flight state, camera spline, warp/proximity curves
    scene/                 The WebGL scene: <Canvas>, planets, rings, starfield, effects, GLSL
  work/                    Case studies: projects.ts, screenshots, showcase frames, diagrams
  team/                    The people, the orbit cover, its ASCII version and the team orbit
  contact/                 The contact form, its options and validation, the server action
                           and delivery (Resend / Telegram), the contact address
  layout/                  The frame around the light pages: header, cover hero, footer,
                           language switcher, error screen
  legal/                   The terms page and the operator facts it stands on
  language/                Locale config, initTranslations(), provider, LocaleLink, hreflang
  cookies/                 The cookie banner and what it allows to be stored
  seo/                     siteUrl(), JSON-LD, the page list for the sitemap

shared/                    Code with no feature of its own: cn(), useIdle(), glyphs,
                           the ASCII canvas, the station ids
```

The rules, checked in CI by `scripts/ci/boundaries.mjs` (`npm run check:boundaries`):

- `app/` imports modules only, through `@/modules/<name>` or `@/modules/<name>/server`.
- A module imports another module the same way, never a file inside it, and its own files by
  relative path.
- `shared/` imports no module. Modules never import `app/`.
- A `"use client"` file never imports a `server` entry.
- No two modules depend on each other, directly or around a loop.

To add a feature, give it a folder in `modules/`, export what other code needs from its
`index.ts`, and use it from a route. When two modules need the same piece and it belongs to
neither, it goes to `shared/`.

Structure lives in `modules/home/stations.ts` and `modules/work/projects.ts` — ids, scroll
anchors, stack lists, diagram coordinates, metric figures. Every word lives in
`locales/<lang>/`, keyed by those same ids. The navbar, the dock, the HUD and the flat page all
read from both.

---

## Languages

English, Russian and Czech. Every locale is prefixed, including the default: `/en/work/omnibus`,
`/ru/work/omnibus`, `/cs/about`. A bare `/work` is matched against `Accept-Language` and
redirected. A language picked by hand is remembered in the `NEXT_LOCALE` cookie, but only for a
reader who accepted the cookie banner; until then nothing is stored.

The root layout loads all five namespaces (`common`, `stations`, `projects`, `console`, `about`) for the requested language plus English as a fallback,
then hands the resources to the client through `TranslationsProvider` — so the browser
re-initialises from what the server already parsed rather than fetching the JSON again.

**Tone.** Every surface addresses the reader formally (*вы*, *vy*). Copy is short: a headline and
two sentences per station. Positioning, palette and voice are in `.agents/product-marketing.md`.

Stack names, codenames, metric figures and CLI flags stay in English in all three files: a
`--architecture-audit` flag translated into Czech is a joke that does not land, and a budget
range that reads `$10k – $25k` in one language and something else in another is a form nobody
can read the replies to.

### Translation workflow

Translations are managed in [i18nexus](https://i18nexus.com) and committed to the repo, so a
clone builds without network access or an API key.

```bash
cp .env.example .env.local   # then fill in the keys — .env.local is gitignored

npm run i18n:pull      # download the latest translations into locales/
npm run i18n:listen    # same, but live — run it alongside npm run dev
npm run i18n:import    # push the English source strings up, one namespace at a time
```

`i18n:pull` needs only `I18NEXUS_API_KEY`. `i18n:import` also needs
`I18NEXUS_PERSONAL_ACCESS_TOKEN`, because it writes.

`build` deliberately does **not** pull. The committed JSON is the source of truth for a
deployment, and a missing environment variable should not be able to take a production build
down — or, worse, quietly ship a half-translated page.

---

## Architecture notes

**Scroll state bypasses React.** `modules/home/flight.ts` exports a single mutable object read inside
`useFrame` at 60–120 Hz. Routing per-frame scroll through `useState` would spend the entire
frame budget in the reconciler. The HUD writes straight to the DOM in `requestAnimationFrame`
for the same reason.

**Uniforms are attached by ref, not by prop.** React Three Fiber *clones* a `uniforms` object
passed as a JSX prop, so per-frame mutations of your original never reach the GPU. Every shader
here uses `ref={bindUniforms(...)}` from `modules/home/scene/bind-uniforms.ts` instead.

**Scroll-linked keyframes must span 0 to 1.** `motion` promotes scroll-linked `opacity`,
`transform`, and `filter` to a native `ScrollTimeline` animation on the compositor. Chrome fills
whatever slice of that timeline the keyframes leave uncovered by interpolating back toward the
element's *underlying* style — so a window ending at `0.036` faded the hero out on cue and then
quietly faded it back in across the remaining 96% of the page. `ramp()` in `modules/home/stage.tsx`
pads every window out to the full range. The same promotion means a scroll-linked MotionValue
cannot be driven by hand from JS; only real scroll moves it.

**Scroll windows are clamped to `[0, 1]`.** Feeding `useTransform` an input range with stops
outside the source MotionValue's domain crashes the renderer. `sanitizeWindow()` clamps every
window and keeps its stops strictly increasing.

**Camera waypoints are pinned to station anchors.** `WAYPOINTS` in `modules/home/flight.ts` and
`anchor` in `modules/home/stations.ts` are the same numbers, so each station's framing is exact at the scroll
position where its copy is fully open. `warpAt` and `proximityAt` are computed from the same
segment function and are exact inverses of each other.

**Rings are integrated, not textured.** `scene/rings.tsx` derives the orbital radius per fragment from
`length(vLocal.xy)` over a `RingGeometry`, then accumulates opacity with Beer–Lambert:
`alpha = 1 - exp(-density * path)`, where `path = 1/max(cosI, 0.055)`. Grazing angles thicken;
face-on stays razor thin. The planet's shadow across the ring plane is an analytic ray–sphere
intersection, and forward/back scattering is anisotropic, so the far side of the ring lights up
when it is between you and the star.

**Performance.** Stars are a single instanced draw call with all motion in the vertex shader.
`PerformanceMonitor` drops DPR and bloom quality if the frame rate declines.

---

## Accessibility & fallbacks

- `prefers-reduced-motion` is watched live and damps warp intensity to 45% in
  `modules/home/scene/flight-driver.tsx`.
- WebGL is feature-detected on mount, and a context only software can draw (SwiftShader,
  llvmpipe, Microsoft Basic Render Driver) counts as none: the flight would run at a few frames a
  second and block the page. Then, and on touch screens, `modules/home/fallback.tsx` serves a complete
  document — the hero, all four stations with their projects, the team and the contact form —
  instead of the camera flight.
- The console requires at least one engagement type and a valid return address before it will
  fire, and reports failures inline.
- Decorative layers are marked `aria-hidden`, and controls carry explicit `aria-label` /
  `aria-pressed` / `aria-expanded`.

The console has no backend. Submitting validates the form, composes an email with every field
and opens it in the visitor's mail app (`mailto:` to the address in
`modules/contact/contact.ts`); the receipt says plainly that nothing is sent until they press Send, and offers a copy of the message. Wiring a
real endpoint (a route handler with Resend, or a form service) is a change to `submit()` in
`modules/home/transmission-console.tsx`.

---

## Tuning

Most of the direction lives in three files.

- `modules/home/stations.ts` — the `anchor` per station. Moving one retimes the narrative; move the
  matching entry in `WAYPOINTS` with it. The words are in `locales/<lang>/stations.json`.
- `modules/home/flight.ts` — `WAYPOINTS` (the camera spline), `warpAt` (when warp ramps), `BODY`
  (where each body sits and how big it is).
- `modules/home/scene/effects.tsx` — bloom intensity and threshold, aberration, vignette, grain.

The scroll runway length is `RUNWAY` at the top of `modules/home/experience.tsx`. Shorten it for a
faster, denser edit; lengthen it to let each station breathe.
