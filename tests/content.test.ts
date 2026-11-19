import { describe, expect, it } from "vitest";
import {
  about,
  accentNames,
  agentCount,
  bench,
  contact,
  finalAccent,
  finaleWords,
  hero,
  links,
  projects,
  stack,
  stats,
  timeline,
} from "../src/lib/content";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const VERCEL_DOMAIN_RE = /\.vercel\.app/i;

describe("content is shippable as-is", () => {
  it("hero has all fields", () => {
    expect(hero.name.length).toBeGreaterThan(0);
    expect(hero.role.length).toBeGreaterThan(0);
    expect(hero.lede.length).toBeGreaterThan(0);
    expect(hero.tagline.length).toBeGreaterThan(0);
  });

  it("has no leaks: no email address, no hard-coded domain", () => {
    const blob = JSON.stringify({
      hero,
      bench,
      stats,
      about,
      timeline,
      projects,
      stack,
      contact,
      links,
    });
    expect(blob).not.toMatch(EMAIL_RE);
    expect(blob).not.toMatch(VERCEL_DOMAIN_RE);
  });

  it("links are well-formed", () => {
    expect(links.github).toMatch(/^https:\/\//);
    expect(links.linkedin).toMatch(/^https:\/\//);
    expect(links.resume).toBe("/Resume.pdf");
  });

  it("contact buttons are all reachable and non-empty", () => {
    expect(contact.buttons.length).toBeGreaterThanOrEqual(3);
    for (const b of contact.buttons) {
      expect(b.label.length).toBeGreaterThan(0);
      expect(b.href.length).toBeGreaterThan(0);
    }
  });

  it("six projects, each unique, each tagged, each linked", () => {
    expect(projects.length).toBe(6);
    const names = new Set(projects.map((p) => p.name));
    expect(names.size).toBe(6);
    for (const p of projects) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.blurb.length).toBeGreaterThan(20);
      expect(p.tags.length).toBeGreaterThanOrEqual(2);
      expect(p.href).toMatch(/^https:\/\//);
    }
  });

  it("stack rows are non-empty, exactly one hot item each (or none)", () => {
    for (const row of stack) {
      expect(row.label.length).toBeGreaterThan(0);
      expect(row.items.length).toBeGreaterThanOrEqual(4);
      const hot = row.items.filter((i) => i === row.hot);
      if (row.hot) expect(hot.length).toBe(1);
    }
  });

  it("timeline, bench and stats are complete", () => {
    expect(timeline.length).toBe(4);
    expect(bench.length).toBe(3);
    expect(stats.length).toBe(3);
    for (const s of stats) {
      expect(s.value.length).toBeGreaterThan(0);
      expect(s.label.length).toBeGreaterThan(5);
    }
  });

  it("the engine's finale words are set (ABHISHEK ♥ LET'S BUILD)", () => {
    expect(finaleWords).toEqual(["ABHISHEK", "♥", "LET'S BUILD"]);
  });

  it("final accent is orange and agent count is sane", () => {
    expect(finalAccent).toBe("orange");
    expect(accentNames).toContain(finalAccent);
    expect(agentCount).toBe(18);
  });
});
