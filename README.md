# Abhishek Kumar T — portfolio

A single-page portfolio that assembles itself: eighteen cursor agents type the copy, wire the
blocks, pick the accent colour and spell the finale message at the contact section.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript** and **Tailwind CSS 4**.
Static output — no server, no database, no runtime dependencies.

## Run

```bash
npm install
npm run dev      # → http://localhost:3000
```

```bash
npm run build && npm start   # production
npm run typecheck             # tsc --noEmit
npm test                      # vitest content checks
npm run test:e2e              # static + browser smoke tests (needs pip install playwright)
```

> **This is not a public project to copy or reuse.** See the license section below before
> doing anything with this repository.

Set the deployment domain in one place before publishing — the metadata, the Open Graph
tags, `sitemap.xml` and `robots.txt` all read it:

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

Nothing else in the project hard-codes a domain.

## How it is put together

```
src/
  app/
    layout.tsx        fonts (next/font/local), metadata, OG tags
    page.tsx          the content — server component, no client JS of its own
    globals.css       design tokens + the bespoke pieces (mega type, name block, HUD)
  components/
    Engine.tsx        client: mounts the engine, renders the ready screen and the HUD
    thumbs.tsx        the six project card drawings
  lib/
    content.ts        every word on the page — edit here, not in the markup
    engine.ts         the build engine: clock, agents, wires, typing, picker, swarm, sound
```

**The engine is framework-agnostic on purpose.** React renders the page once; `engine.ts`
drives every frame imperatively. No frame touches React state, so the 60fps loop never
triggers a re-render — that is what keeps it smooth on a phone. `mountEngine()` returns a
teardown that removes every listener, timer, observer and the AudioContext, so React
StrictMode's double mount in development cannot double the agents.

### Why the parts look the way they do

| Piece | Reason |
|---|---|
| Virtual clock (`vt`) | Delays and tweens share one timeline, so pause, 1×/2×/0.5× speed and replay stay in sync |
| The clock follows **wall time**, not the frame count | On a slow device the animation drops frames but the build still takes the same time — otherwise a throttled browser stretches a 35s build into ten minutes and only the first blocks ever appear |
| `dt` clamped to 50ms | The physics/drift step stays stable after a background tab returns |
| Frame loop skipped when `document.hidden` | No point rendering a tab nobody is looking at |
| One way in | Space, the Start button and the HUD play all call the same `toggle()`; scrolling never starts the build, so no path can leave it half-built |
| Replay rebuilds **in place** | A page reload re-renders the document, which reads as "the hero rendered twice" |
| Canvas DPR capped at 2 | A 3x phone screen would quadruple the draw cost of the particle swarm |
| Particle count scales with viewport width | Density, not canvas area, is what makes the finale legible on small screens |
| Swarm samples the **ink area**, not the canvas | Stepping over the canvas area piles particles on top of each other and the word turns to mush |
| The heart is a symmetric bezier, centred on its ink box | The classic parametric heart samples unevenly and sits off-centre |
| Swarm re-fits on `resize` | The word is re-sampled against the new stage box, so it follows the screen size without a refresh |
| Ring angle from the agent index | `index / count`, not a random phase — the cursors sit evenly around the button |
| Typing limited to short strings | Splitting a 400-character paragraph would create hundreds of nodes |
| `getBoundingClientRect` read before writes | Layout thrash is what makes a page feel laggy |
| Hero is `min-height`, not `height` | A taller intro grows the hero instead of overlapping the stats row |
| Portrait sized by `aspect-ratio` | No container query: the disc can never collapse to zero height |
| `overflow-x: hidden` on `html` | Long words and the HUD can never create a horizontal scrollbar |
| Reduced motion | The finished page is shown immediately, controls stay available |

### Controls

| Key / input | Action |
|---|---|
| `Space` | start / pause the build |
| `R` | replay from the top |
| `A` | auto-scroll on / off |
| `H` | hide the HUD and the pointer |
| `1` `2` `3` | speed 1× / 2× / 0.5× |
| `C` | cycle accent colour |
| `M` | mute |

The HUD bar carries the same controls as buttons: play/pause, Auto, speed, sound, replay —
all five stay visible down to a 320px phone.

The page waits for you: press **Space**, **click anywhere** or press the HUD play button.
All three call the same `toggle()`, so they behave identically — scrolling never starts the
build, and the play button pauses and resumes exactly like Space does. Pressing play after
the build has finished rebuilds the page in place, from block 0 (no reload, no re-render,
no artifacts from the previous build).

**Sound** needs one interaction first — browsers block audio until the user acts, so the
speaker button pulses blue until it is awake.

## Content

Everything the page says lives in `src/lib/content.ts`: the hero, the bench list, the
timeline, the six projects, the stack rows, the contact buttons and the accent list. Editing
that file changes the site without touching the engine. Only project **names** are links;
chips and tags are plain text.

## Assets

`public/` holds the portrait, the résumé (email removed), the Open Graph image, the favicon
set and the PWA manifest. The two typefaces are embedded as base64 woff2 under
`src/app/fonts/` and served by `next/font/local` — Big Shoulders Display and Bricolage
Grotesque, both SIL Open Font License 1.1.

## Accessibility

`prefers-reduced-motion` renders the finished page and keeps the controls, and stops the
decorative loops (the ping dot, the card animations, the pulsing speaker). Focus rings on
every link and button, a skip link to the content, `aria-live` on the status line, labelled
toolbar buttons, `touch-action: manipulation` on every tap target, 40px HUD buttons on
phones, safe-area padding for notched screens, `color-scheme: dark` so the scrollbar and
form controls match, and a `<noscript>` rule that unlocks scrolling if JavaScript never
runs.

## Licence

**View-only / all rights reserved — see [LICENSE](LICENSE).** This portfolio is published
so it can be read and learned from, not copied, reused, relicensed or reverse-engineered
by anyone without written permission. The typefaces are SIL OFL 1.1 and keep their own
licence (`src/app/fonts/*-OFL.txt`).

## Docs

- [`AGENTS.md`](AGENTS.md) — what AI agents (and humans) must not break here
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — the engine, the replay contract, the layers
- [`PLAN.md`](PLAN.md) — done / next / constraints
- [`NOTICE.md`](NOTICE.md) — third-party components
- [`llms.txt`](llms.txt) — a machine-readable summary for AI tools
- [`CHANGELOG.md`](CHANGELOG.md) — what changed and why
