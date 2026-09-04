import { describe, it, expect } from "vitest";
import {
  emptyWorld,
  worldDistance,
  travelDays,
  regionAt,
  TERRAIN_KINDS,
  SITE_KINDS,
  WORLD_THEMES,
} from "@/lib/world";
import { starterWorld } from "@/lib/world-generator";
import { repairWorld } from "@/lib/world-repair";
import {
  campaignThemes,
  ensureCampaignWorld,
  worldContext,
  shapeWorld,
  moveParty,
  discoverSite,
} from "@/lib/campaign-world";
import { emptyCampaign } from "@/lib/campaign";

describe("world model", () => {
  it("creates an empty world", () => {
    const w = emptyWorld("w1", "Aeloria");
    expect(w.name).toBe("Aeloria");
    expect(w.regions).toEqual([]);
    expect(w.party).toEqual({ x: 50, y: 50 });
    expect(TERRAIN_KINDS.length).toBeGreaterThan(5);
    expect(SITE_KINDS.length).toBeGreaterThan(5);
    expect(WORLD_THEMES.length).toBeGreaterThan(5);
  });

  it("measures distance and travel time", () => {
    expect(worldDistance({ x: 0, y: 0 }, { x: 3, y: 4 }, 10)).toBe(50);
    const road = travelDays(100, 24, "plains");
    const swamp = travelDays(100, 24, "swamp");
    expect(swamp).toBeGreaterThan(road);
  });

  it("finds the region under a point", () => {
    const w = emptyWorld("w2", "Test");
    w.regions = [{ id: "r1", name: "Vale", terrain: "plains", x: 10, y: 10, w: 20, h: 20 }];
    expect(regionAt(w, 15, 15)?.id).toBe("r1");
    expect(regionAt(w, 90, 90)).toBeUndefined();
  });
});

describe("world generation", () => {
  it("is deterministic for the same seed and varied across seeds", () => {
    const a = starterWorld("seed-a", "Aeloria", ["High fantasy"]);
    const b = starterWorld("seed-a", "Aeloria", ["High fantasy"]);
    const c = starterWorld("seed-b", "Karrath", ["Grim-dark"]);

    expect(a.regions.map((r) => r.name)).toEqual(b.regions.map((r) => r.name));
    expect(a.sites.map((s) => s.name)).not.toEqual(c.sites.map((s) => s.name));
    expect(a.regions.length).toBeGreaterThanOrEqual(5);
    expect(a.sites.length).toBeGreaterThanOrEqual(4);
    expect(a.factions.length).toBeGreaterThan(0);
    expect(a.pantheon.length).toBeGreaterThan(0);
  });

  it("never produces doubled site names", () => {
    for (const seed of ["s1", "s2", "s3", "s4", "s5"]) {
      const w = starterWorld(seed, `World ${seed}`);
      for (const s of w.sites) expect(s.name.toLowerCase()).not.toMatch(/^([a-z]+)\1$/);
    }
  });
});

describe("world repair", () => {
  it("renames duplicates, fixes water crossings and adds ports", () => {
    const w = emptyWorld("w3", "Broken");
    w.regions = [
      { id: "r1", name: "West", terrain: "plains", x: 5, y: 5, w: 15, h: 15 },
      { id: "r2", name: "East", terrain: "plains", x: 60, y: 5, w: 15, h: 15 },
    ];
    w.sites = [
      { id: "s1", name: "Wellwell", kind: "town", x: 10, y: 10, discovered: true },
      { id: "s2", name: "Mistfall", kind: "town", x: 65, y: 10, discovered: true },
    ];
    w.routes = [{ id: "rt1", fromSiteId: "s1", toSiteId: "s2", kind: "road" }];

    const { world, changed } = repairWorld(w);
    expect(changed).toBe(true);
    expect(world.sites[0]!.name.toLowerCase()).not.toBe("wellwell");
    const overWater = world.routes.find((r) => r.fromSiteId === "s1" && r.toSiteId === "s2");
    expect(overWater === undefined || overWater.kind === "sea").toBe(true);
  });

  it("leaves a generated world stable on a second pass", () => {
    const gen = starterWorld("stable", "Stable");
    const first = repairWorld(gen).world;
    const second = repairWorld(first);
    expect(second.world.sites.map((s) => s.name)).toEqual(first.sites.map((s) => s.name));
  });
});

describe("campaign world glue", () => {
  it("derives themes and creates a starter world", () => {
    const campaign = { ...emptyCampaign("hero-1"), styles: ["grim-dark", "nautical-pirate"] as never };
    expect(campaignThemes(campaign).length).toBeGreaterThan(0);

    const { campaign: next, world } = ensureCampaignWorld(campaign);
    expect(world.sites.length).toBeGreaterThan(0);
    expect(next.worldId ?? world.id).toBeTruthy();

    expect(worldContext(world)).toContain(world.name);
    expect(worldContext(undefined)).toBeTypeOf("string");
  });

  it("shapes the world, moves the party and reveals sites", () => {
    const { world } = ensureCampaignWorld(emptyCampaign("hero-2"));

    const shaped = shapeWorld(world, {
      sites: [{ name: "Ash Hollow", kind: "village", x: 20, y: 20, description: "Charcoal burners." }],
    } as never);
    expect(shaped.world.sites.some((s) => s.name === "Ash Hollow")).toBe(true);
    expect(shaped.summary).toBeTruthy();

    const target = shaped.world.sites[0]!;
    const moved = moveParty(shaped.world, { siteName: target.name } as never);
    expect(moved.summary).toBeTruthy();

    const found = discoverSite(moved.world, target.name);
    expect(found.world.sites.find((s) => s.id === target.id)!.discovered).toBe(true);
    expect(discoverSite(moved.world, "does not exist").summary).toBeTruthy();
  });
});
