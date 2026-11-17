#!/usr/bin/env python3
"""
Smoke tests for the portfolio.

Run against the dev server (npm run dev -> http://localhost:3000):
    python tests/smoke.py

Every check prints PASS or FAIL; the script exits 1 if anything fails.
"""

import hashlib
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "http://localhost:3000"

# Tokens the repository must never mention, stored as sha256 digests of the lowercased
# token — the file must not contain the strings it exists to exclude.
BANNED_TOKENS = {
    "776d5df1f2fa1d1e716abb7405c65e8c4209928cdcd153bf5b3258110703b885",
    "09de4daa5232ead973ffd307d631eba698a930feb087388bc41d77ca2e07a88c",
}
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
SKIP_DIRS = {".git", "node_modules", ".next", "tests"}
SKIP_FILES = {"package-lock.json", "tsconfig.tsbuildinfo"}


def static_checks():
    print("\n== static checks ==")
    failures = 0

    def check(name, cond):
        nonlocal failures
        print(("PASS" if cond else "FAIL"), "-", name)
        if not cond:
            failures += 1

    # 1. no stray references or email addresses anywhere in the project
    hits = []
    for f in ROOT.rglob("*"):
        if not f.is_file():
            continue
        if any(part in SKIP_DIRS for part in f.relative_to(ROOT).parts) or f.name in SKIP_FILES:
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for tok in set(re.findall(r"[A-Za-z0-9_-]+", text.lower())):
            if hashlib.sha256(tok.encode()).hexdigest() in BANNED_TOKENS:
                hits.append(f"{f.relative_to(ROOT)}: contains a blocked reference")
                break
        for m in EMAIL_RE.findall(text):
            hits.append(f"{f.relative_to(ROOT)}: contains an email address ({m})")
    check("no stray references, no email addresses anywhere in the repo", not hits)
    for h in hits:
        print("       ", h)

    # 2. metadata does not hard-code a production domain
    layout = (ROOT / "src" / "app" / "layout.tsx").read_text(encoding="utf-8")
    check("metadata does not hard-code a production domain", "abhishek-kumar-t.vercel.app" not in layout)
    site = (ROOT / "src" / "lib" / "site.ts").read_text(encoding="utf-8")
    check("NEXT_PUBLIC_SITE_URL is the only domain source", "abhishek-kumar-t.vercel.app" not in site)

    # 3. project structure
    check("package.json present", (ROOT / "package.json").is_file())
    check("next.config.ts present", (ROOT / "next.config.ts").is_file())
    check("page.tsx present", (ROOT / "src" / "app" / "page.tsx").is_file())
    check("LICENSE present", (ROOT / "LICENSE").is_file())
    check("README.md present", (ROOT / "README.md").is_file())
    check("llms.txt present", (ROOT / "llms.txt").is_file())

    # 4. the resume ships without an email address
    resume_text = (ROOT / "public" / "Resume.pdf").read_bytes().decode("latin-1", errors="ignore")
    check("resume does not contain an email address", not EMAIL_RE.search(resume_text))

    return failures


def browser_checks():
    from playwright.sync_api import sync_playwright

    print("\n== browser checks ==")
    failures = 0

    def check(name, cond):
        nonlocal failures
        print(("PASS" if cond else "FAIL"), "-", name)
        if not cond:
            failures += 1

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            page.goto(BASE + "/?speed=4", wait_until="load", timeout=60_000)
            page.wait_for_timeout(2500)
            check("page title mentions Abhishek Kumar T", "Abhishek Kumar T" in page.title())
            check("ready screen is visible (round profile photo)", page.locator(".chip.photo").is_visible())
            check("page is scroll-locked before start", page.evaluate("() => document.documentElement.classList.contains('locked')"))

            # start the build
            page.click("#bTour")
            page.wait_for_function("() => document.documentElement.classList.contains('locked') === false", timeout=30_000)
            check("start begins the build", True)
            page.wait_for_timeout(600)

            # six project title links, all with href + target=_blank
            titles = page.locator(".card h3 a")
            count = titles.count()
            ok = 0
            for i in range(count):
                href = titles.nth(i).get_attribute("href")
                target = titles.nth(i).get_attribute("target")
                if href and target == "_blank":
                    ok += 1
            check("six project names, all clickable links", count == 6 and ok == 6)

            # stack: two blocks each with three rows
            stacks = page.locator(".stack")
            check("stack section builds in two steps (two groups of three rows)", stacks.count() == 2 and all(s.locator(".row").count() == 3 for s in stacks.all()))
            check("second group waits for a scroll (data-break)", page.locator(".stack--second").count() == 1)

            # wait for the build to finish
            page.wait_for_function("() => document.querySelector('#st') && document.querySelector('#st').textContent === 'Done'", timeout=180_000)
            check("build completes", True)

            def on_count():
                return page.evaluate("() => document.querySelectorAll('[data-b].on').length")

            check("all blocks revealed after the build", on_count() > 130)

            # replay from the top: everything hidden again, ready screen returns, build restarts
            page.click("#bReplay")
            page.wait_for_timeout(200)
            check("after replay all layers hidden again", on_count() == 0)
            check("after replay the ready screen is back", page.locator("#boot").evaluate("el => !el.classList.contains('off')"))
            check("after replay status resets (Ready or scanning)", page.locator("#st").inner_text() in ("Ready", "Scanning page…"))

            # it restarts the build by itself
            page.wait_for_function("() => document.documentElement.classList.contains('locked') === false", timeout=30_000)
            check("replay restarts the build from the first block", True)
            page.wait_for_function("() => document.querySelector('#st') && document.querySelector('#st').textContent === 'Done'", timeout=180_000)
            check("replay completes again", True)

            # mid-build replay: must reset again cleanly
            page.reload(wait_until="load", timeout=60_000)
            page.wait_for_timeout(2000)
            page.click("#bTour")
            page.wait_for_timeout(1200)
            page.click("#bReplay")
            page.wait_for_timeout(300)
            check("mid-build replay un-reveals the page", on_count() == 0)

            browser.close()
    except Exception as e:
        print(f"FAIL - browser checks aborted: {e}")
        failures += 1
    return failures


def main():
    failures = static_checks()
    failures += browser_checks()
    print()
    if failures:
        print(f"FAILED: {failures} check(s) failed")
        return 1
    print("ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
