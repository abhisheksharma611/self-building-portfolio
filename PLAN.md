# PLAN.md — where this is going

A living plan. Update it when a step lands or a priority changes.

## Done

- [x] The 18-agent build choreography: wires, typewriter, colour picker, finale swarm,
      sound design, HUD controls, virtual clock, replay-in-place.
- [x] Ready screen: profile photo, name, round disc, Space / click to start — no
      auto-start (by design).
- [x] Content: bio, timeline, six real GitHub projects, stack rows, nine certifications,
      contact section — all from real public sources; no fabricated numbers.
- [x] Next.js 16 / React 19 / TS / Tailwind 4 — written from scratch.
- [x] Correctness passes: replay contract (no artifacts survive a replay), reduced-motion
      path, mobile layout at 390px and up, no horizontal scroll, rebuilt-on-replay
      starting from block 0.
- [x] Tests: `tests/content.test.ts` (vitest) + `tests/smoke.py` (browser checks) +
      GitHub Actions CI (`.github/workflows/ci.yml`).
- [x] Docs: README, ARCHITECTURE, llms.txt, NOTICE, LICENSE (view-only / all rights
      reserved), this plan, AGENTS.md.

## Next (in priority order)

1. [x] Push to the project's own repository and attach CI. Done 2026-11-17:
       https://github.com/abhisheksharma611/self-building-portfolio
2. [ ] JSON-LD `Person` structured data — the predecessor site already has one; match it.
2. [ ] Interactive demo of the spam classifier (paste an email → model scores it).
       It makes the portfolio demonstrable, not just readable. Needs the model's weights
       or a hosted endpoint; decide before wiring the UI.
3. [ ] GitHub stats strip (public repos, stars, last push) — build-time fetch with
       `force-cache`; graceful fallback when offline.
4. [ ] Ctrl+K palette: jump to section / copy GitHub URL / copy LinkedIn URL.
5. [ ] `?` shortcut overlay listing the keyboard map.
6. [ ] JSON-LD `Person` structured data.

## Push plan (executed once — the maintainer owns all future pushes)

Every gate was green on the working tree. All on `master`. Executed 2026-11-17.

- **Commit 0 — hygiene:** LICENSE, NOTICE, README.md, AGENTS.md, ARCHITECTURE.md,
  llms.txt, CONTRIBUTING.md, SECURITY.md, CHANGELOG.md, PLAN.md, .gitignore. Gate:
  docs-by-inspection only; README and llms.txt render on the GitHub preview.
- **Commit 1 — toolchain:** package.json, package-lock.json, next.config.ts, tsconfig.json,
  postcss.config.mjs, .github/workflows/ci.yml. Gate: `npm ci --dry-run` green; node
  version matches the workflow.
- **Commit 2 — assets:** public/ (favicons, Avatar.webp, Resume.pdf, og-image.webp). Gate:
  every asset loads on `npm run dev`; images pass `next build`.
- **Commit 3 — engine:** src/lib/ (site.ts, content.ts, engine.ts), src/components/
  (Engine.tsx, thumbs.tsx). Gate: `npx tsc --noEmit` clean; full suite at commit 4.
- **Commit 4 — app:** src/app/ (layout.tsx, page.tsx, globals.css, robots.ts, sitemap.ts,
  fonts). Gate: `npm run typecheck`, `npm test`, `npm run build`,
  `python tests/smoke.py` — ALL green.
- **Commit 5 — tests:** tests/ (content.test.ts, smoke.py). Gate: `npm test` green;
  smoke suite green against `npm run dev`.
- **Push** after commit 4 is green. Never push a red build; CI is the backstop, not the gate.
- Final sweep before pushing: `git status` shows zero untracked junk; `git check-ignore`
  confirms node_modules / .next / local tool directories / tsbuildinfo / next-env.d.ts are
  ignored; no secrets anywhere in the tree.

## Constraints (do not renegotiate without the maintainer)

- No email address appears anywhere in the repo. The resume ships with the email removed.
- This is view-only / all-rights-reserved. It must never be relicensed MIT/CC0.
- No "copy this into your site" invitation. The README must keep the restriction clear.

## Roadmap themes

- Every block builds from real, public data.
- Each change is verified before the next; if a phase goes red, fix it before moving on.
