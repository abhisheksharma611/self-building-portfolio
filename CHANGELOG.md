# CHANGELOG

All notable changes to this project. This project is view-only; see `LICENSE`.

## [Unreleased]

### Added
- The 18-agent build choreography, written in TypeScript: a framework-agnostic
  engine that owns every frame (virtual clock, wires, typewriter, accent picker, swarm
  finale, sound design, replay-in-place).
- Pre-start idle, in three squads of six cursors, until the user taps Start:
  **Drifter** (slow sine currents sweeping the viewport, alternate lanes swimming opposite),
  **Radar** (a breathing elliptical ring around the portrait disc), **Shimmer grid** (a fixed
  6×3 grid whose vertical wave travels column by column). Parametric motion only — zero DOM
  reads per cursor; the disc rect is measured once per frame and passed to agents.
- Cursor role labels stay hidden on the Ready screen (`#stage.prelaunch`); labels appear
  when the build starts and after a replay has returned to Ready.
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4, static prerender.
- Ready screen with the profile photo; start via Space or click anywhere (no auto-start).
- The six cards build in two steps; stack builds in two steps (three rows each), with a
  scroll in between.
- `tests/content.test.ts` (vitest), `tests/smoke.py` (24 Playwright checks) and GitHub
  Actions CI (`.github/workflows/ci.yml`).
- Full documentation set: `ARCHITECTURE.md`, `AGENTS.md`, `PLAN.md`, `NOTICE.md`,
  `CONTRIBUTING.md`, `SECURITY.md`, `llms.txt`.

### Changed
- "DEVELOPER" mega-word reveal now plays a short keyboard clack instead of the whoosh —
  crisp mechanical snap, distinct from the scan and pointer clicks.
- The "This portfolio" project card points at the actual GitHub repo
  (`abhisheksharma611/self-building-portfolio`) instead of the profile page.

### Fixed
- Resume: the address on the contact line was not properly masked, so it identified the
  mailbox; it is removed entirely now. The portfolio URL takes that line. The resume
  contains no email anywhere.
- Resume: the swapped URL's hover target pointed at the old mailto — fixed to the site
  URL; the stale hotspot on the old second line is gone; the trailing pipe on the URL
  line is trimmed. (An earlier pass briefly blanked the profession subtitle line — that
  change was reverted; the line is back exactly as it was.)
- Pressing **a** (auto toggle, or clicking the Auto HUD button) on a freshly reloaded page
  built blocks under the Ready card and scrolled the page. Root cause: `buildInView()` had
  no `started`/`resumable` gate, and browsers restore the pre-reload scroll position on
  refresh — so the blocks intersecting a 3 412 px scroll got built invisibly underneath
  the boot overlay. Both gates added; `scrollTo(0, 0)` runs at mount so a reload always
  opens at the top with nothing built.
- The finale swarm rendered a bare minimum of particles who spelled \"LET'S BUILD\" as
  guessable mush on narrow screens (260 fixed). Density now scales with viewport width
  (≈475 at 414 px), mobile particle size is up a notch, and the swarm stage is taller
  (`clamp(200px, 42vh, 380px)`), so the word reads the same on small and large viewports.
- Audio on a cold visit could stay silent on the first tap, double-stack, or never
  start. One resume per tap now — `unlock()` creates the context in that gesture and
  returns its resume promise; the scan whoosh fires exactly once from that promise.
  Tones play on the plain gate, no deferral chains.
- Replay no longer leaves artifacts: the scan line resets, the mega-word stroke, the
  typed spans, the wires, the swarm frame and the `.on` classes are all undone, and the
  build restarts from block 0.
- Pressing **a** (auto-scroll/Gliding) after the build finished did nothing: `html` had
  `scroll-behavior: smooth`, and every engine-written scroll restarted easing so the page
  froze at 0. CSS smooth removed — the engine eases every scroll itself; touch momentum was
  already handled separately.
- The ready-screen banner no longer steals taps/clicks from its card on touch devices;
  tap-to-start now fires on the first gesture (pointerdown), not after the 300 ms click
  latency, with the HUD excluded.
- Touch momentum no longer fights the auto-tour (`pointerIsDown` gate; `manualUntil` holds
  3 s after touch moves); `overflow-x: clip` keeps iOS momentum scrolling intact.
- Cursors appeared only after the profile card finished fading (~1.3 s on a phone): wander
  mode started only once the scan completed. `idleMode = "wander"` now fires at tap, and
  agents spawn scattered across the viewport instead of bunched behind the card — measured
  centre-to-edge spread grows from tap instant (~105 px → 190 px by 0.5 s → ~290 px by 1 s).
  The first six cursors are also aimed straight at the hero blocks at tap, so they are on
  station before the card has fully faded.
- Build pace: the wander spring was too soft (`k 1.5`, damping `dt*0.006`), which made the
  cursors crawl and wobble; `k 2.6` / `dt*0.009` now. Agent flings were capped at 760 ms
  (felt floaty on large screens); now 470 ms max.
- Clicking **any** project title reliably opens the repo — the hover affordance covers
  the whole name, with a pointer cursor, and the cards stay fixed (no accidental hover
  motion).
- The swarm samples the drawn pixels rather than an average-area grid, so the finale is
  crisp instead of smudged.
- Horizontal scroll is gone at every viewport size; the hero no longer overlaps the
  stats row at narrow widths; the ready card no longer swallows pointer events after it
  fades out.
