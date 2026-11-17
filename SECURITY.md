# SECURITY.md

This is a static site (no server, no database, no backend beyond what the static host
serves) and is not designed to be a target — but reports are still welcome.

## Reporting a vulnerability

Open a GitHub issue titled `Security: <short description>` or contact the author via the
GitHub profile in the README. Please include:

- the affected file / route,
- the impact (data exposure? code execution? deface?),
- a minimal reproduction, if you can.

Do not publish an exploit before giving the maintainer reasonable time to respond.
No bounty is offered; this repo is not a program.

## Scope

In scope: the built site, this repo's CI workflow, and anything that could serve
arbitrary content in a context this site creates (e.g. the OG tags rendered into search
result snippets).

Out of scope: issues in dependencies that are marked `developmentDependency` and never
reach the shipped bundle, social-engineering attacks against the author, and this
project's legal status (see `LICENSE`).

## Data

- No cookies, no analytics, no tracking pixels, no third-party scripts.
- The only network requests the page makes at runtime are to this origin (its own
  static assets) — `icon`, `fonts` are self-hosted.
- The résumé is a local file with the email removed.
