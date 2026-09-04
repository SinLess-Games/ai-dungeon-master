import { describe, it, expect } from "vitest";
import {
  MAP_TERRAINS,
  PROP_KINDS,
  TOKEN_SIZES,
  makeLevel,
  emptyMap,
  tileIndex,
  tileAt,
  gridDistanceFeet,
  fallingDamage,
  highGroundBonus,
  coverBonus,
  hasLineOfSight,
  revealAround,
} from "@/lib/tacticalmap";

describe("tactical maps", () => {
  it("exposes terrain, prop and size tables", () => {
    expect(MAP_TERRAINS.length).toBeGreaterThan(3);
    expect(PROP_KINDS.some((p) => p.blocksSight)).toBe(true);
    expect(TOKEN_SIZES.length).toBeGreaterThan(3);
  });

  it("builds levels and maps", () => {
    const level = makeLevel("l1", "Ground", 0, 10, 8);
    expect(level.width).toBe(10);
    expect(level.tiles.length).toBe(80);

    const map = emptyMap("m1", "Crypt", level.id, "dungeon");
    expect(map.name).toBe("Crypt");
    expect(map.kind).toBe("dungeon");
  });

  it("indexes tiles", () => {
    const level = makeLevel("l1", "Ground", 0, 6, 6);
    expect(tileIndex(level, 2, 3)).toBe(3 * 6 + 2);
    expect(tileAt(level, 2, 3)).toBeTruthy();
    expect(tileAt(level, 99, 99)).toBeUndefined();
  });

  it("measures 3.5 diagonal distance", () => {
    expect(gridDistanceFeet({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(15);
    expect(gridDistanceFeet({ x: 0, y: 0 }, { x: 2, y: 2 })).toBe(15);
  });

  it("applies falling, high ground and cover", () => {
    expect(fallingDamage(0)).toBe("none");
    expect(fallingDamage(30)).toBe("3d6");
    expect(fallingDamage(500)).toBe("20d6");
    expect(highGroundBonus(1, 0)).toBeGreaterThan(0);
    expect(highGroundBonus(0, 1)).toBe(0);
    expect(coverBonus(true, false).ac).toBe(4);
    expect(coverBonus(false, true).ac).toBe(2);
    expect(coverBonus(false, false).ac).toBe(0);
  });

  it("traces line of sight and reveals fog", () => {
    const level = makeLevel("l1", "Ground", 0, 12, 12);
    const clear = hasLineOfSight(level, [], { x: 0, y: 0 }, { x: 5, y: 0 });
    expect(typeof clear).toBe("boolean");

    revealAround(level, [], 5, 5, 3);
    expect(level.revealed.filter(Boolean).length).toBeGreaterThan(0);
  });
});
