# Architecture

How this page works — for anyone deciding how to read, run and trust the code.
View-only; see `LICENSE`.

## The stack

- **Next.js 16** (App Router, Turbopack) — static prerender, no server at runtime.
- **React 19** — renders the page **once**, at build time and at navigation.
- **TypeScript** everywhere.
- **Tailwind CSS 4** — used for utilities in components (`flex`, `grid`, `gap`, …);
  the bespoke pieces (mega type, name block, HUD, boot card) are plain CSS with custom
  properties in `src/app/globals.css`.

## The one architectural decision: the engine owns the frame

React is the *initial* renderer and nothing more. `src/lib/engine.ts` is a
framework-agnostic TypeScript module that:

- walks the DOM once at mount (`[data-block]`, `[data-b]`),
- splits labelled text into per-character spans when it needs to type them,
- drives all motion through a **virtual clock** (`vt`) that can be paused (`Space`),
  sped up (1/2/0.5×) and replayed,
- owns the rAF loop (`frame()`), the agent jobs, the wires, the swarm and the sounds.

No React state changes after mount. That keeps the build smooth on a phone.

## The build sequence

```
start()                  ← Space / clickanywhere / replay
  → Scanning…            ← the .scan line sweeps once, the ready card fades out
  → tour()               ← visits blocks in document order, groups them to the viewport
      → buildBlock()     ← jobs are dispatched to the 18 agents
          → wireJob()    ← each agent drags a wire to every [data-b] box
          → resolveJob() ← each box's content appears (typewriter / click / stroke-draw)
  → pickColour()         ← when the hero is done, agent #2 walks the accent picker and
                           settles on orange (visiting blue, red, mint, violet first)
  → finale()             ← the swarm spells ABHISHEK, ♥, LET'S BUILD around the contact button
```

## The replay contract

Replay (`#bReplay`) or pressing `Space` when the build is finished calls `reset()`, which
must leave the page byte-for-byte equivalent to a fresh first load:

1. bumps `buildGeneration` — every in-flight job, tween, timer and tour checks it and
   returns immediately without touching the DOM; increments a matching `tourGeneration`
   so the old tour dies at its next step;
2. clears the scheduler (`timers.clear()`, `tweens.clear()`, `queue.length = 0`);
3. unwraps every `.ch` span back into plain text (the typewriter merges its spans back);
4. clears the swarm canvas and removes all wires;
5. re-creates the agents around the card in a ring;
6. removes every `.on` class (everything becomes invisible again), resets the mega-word
   `stroke-dashoffset`, the HUD layer counter and the IntersectionObserver set;
7. scrolls to the top, re-shows the Ready card with the profile photo, sets "Ready",
   and auto-starts the build again after a short beat.

**Invariant: when the scan starts, no previous-build artifact may be visible.**
When `start()` runs it flips `started = true` and waits for the scan + fade
(`resumable = true`) before the tour or the IntersectionObserver build anything.

Violating this is the classic "replay is broken" bug. The tests exercise it
(`tests/smoke.py`).

## The ready screen vs build phase

```
Locked page → Ready card (profile photo, name, "18 agents will build this page")
            → Space / click anywhere / replay
            → scan line sweeps → profile card fades out → build from the top
            → after the build finishes, Space/R replay the whole choreography
```

## Layers (back to front)

| z  | Layer          | Pointer events | Purpose |
|----|----------------|----------------|---------|
| 70 | `.hud`         | hit-tested     | build controls: play/pause, auto-scroll, speed, sound, replay |
| 60 | `.scan`        | none           | the sweep line on start |
| 55 | `#swarm`       | none           | connector particles for the finale |
| 50 | `#stage`       | none           | wires + the 18 agents + the colour picker |
| 40 | `.boot`        | hit-tested     | the Ready card (fades to opacity 0 + `visibility: hidden`) |
| 20 | `.hero` grid   | hit-tested     | the page itself |

`#stage` and `#swarm` are `pointer-events: none` so the page below is never blocked,
including the invisible parts of the ready card once it has faded.

## Reduced motion

`prefers-reduced-motion: reduce` → no agents sweep, no wires draw, the finished page
renders as-is (accent = orange), all controls stay usable.
`prefers-reduced-motion: no-preference` → the full choreography.

## Environment variables

| Variable | Default | Used for |
|----------|---------|----------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `metadataBase`, OG tags, `sitemap.xml`, `robots.txt` |
| `PORT` | `3000` | `next start` |
