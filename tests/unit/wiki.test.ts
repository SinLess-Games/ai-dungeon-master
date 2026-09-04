import { describe, it, expect } from "vitest";
import { PLAYER_ARTICLES, PLAYER_CATEGORIES } from "@/lib/wiki/player-guide";
import { EXPANSION_ARTICLES } from "@/lib/wiki/expansions";
import { EXPANSION2_ARTICLES } from "@/lib/wiki/expansions2";
import { EXPANSION3_ARTICLES } from "@/lib/wiki/expansions3";
import { EXPANSION4_ARTICLES } from "@/lib/wiki/expansions4";
import { EXPANSION5_ARTICLES } from "@/lib/wiki/expansions5";
import { EXPANSION6_ARTICLES } from "@/lib/wiki/expansions6";
import { EXPANSION7_ARTICLES } from "@/lib/wiki/expansions7";
import { LEADERSHIP_ARTICLES } from "@/lib/wiki/leadership";
import { CLASS_DETAILS } from "@/lib/wiki/class-details";
import { SOURCE_BOOK_COUNT, SOURCE_WEBSITE_COUNT, WEB_SOURCES } from "@/lib/wiki/sources";

const ALL = [
  ...PLAYER_ARTICLES,
  ...EXPANSION_ARTICLES,
  ...EXPANSION2_ARTICLES,
  ...EXPANSION3_ARTICLES,
  ...EXPANSION4_ARTICLES,
  ...EXPANSION5_ARTICLES,
  ...EXPANSION6_ARTICLES,
  ...EXPANSION7_ARTICLES,
  ...LEADERSHIP_ARTICLES,
];

describe("wiki content", () => {
  it("has articles with unique ids, titles and bodies", () => {
    expect(ALL.length).toBeGreaterThan(50);
    const ids = new Set(ALL.map((a) => a.id));
    expect(ids.size).toBe(ALL.length);
    for (const a of ALL) {
      expect(a.title.trim().length).toBeGreaterThan(0);
      expect(a.sections.length).toBeGreaterThan(0);
      for (const sec of a.sections) {
        expect(sec.heading.trim().length).toBeGreaterThan(0);
        expect(sec.body.trim().length).toBeGreaterThan(20);
      }
      expect(a.category.trim().length).toBeGreaterThan(0);
    }
  });

  it("stays player-facing: no DM-only grouping label", () => {
    expect(PLAYER_CATEGORIES.length).toBeGreaterThan(3);
    for (const c of PLAYER_CATEGORIES) expect(String(c).toLowerCase()).not.toBe("player rules");
  });

  it("details every core class", () => {
    const keys = Object.keys(CLASS_DETAILS);
    expect(keys.length).toBeGreaterThanOrEqual(11);
    for (const key of keys) {
      const detail = CLASS_DETAILS[key]!;
      expect(detail).toBeTruthy();
      expect(JSON.stringify(detail).length).toBeGreaterThan(100);
    }
  });

  it("counts its sources", () => {
    expect(SOURCE_BOOK_COUNT).toBeGreaterThan(30);
    expect(SOURCE_WEBSITE_COUNT).toBe(WEB_SOURCES.length);
  });
});
