import { describe, expect, it } from "vitest";
import {
  generateWorldAtlas,
  hashedAtlasEmbedding,
  isWorldAtlasDocument,
  WORLD_ATLAS_GENERATOR_VERSION,
} from "@/modules/worlds/domain/atlas";
import { renderWorldAtlasSvg } from "@/modules/worlds/server/renderAtlasSvg";

const generatedAt = "2026-09-15T00:00:00.000Z";

describe("campaign world atlas generation", () => {
  it("is deterministic for the same campaign seed and decisions", () => {
    const input = {
      seed: "bleak-academy-seed",
      title: "Bleak Academy World",
      templateId: "balanced-realms",
      styleIds: ["high-fantasy", "mystery"],
      structure: "open-world",
      scale: "heroic",
      pace: "moderate",
      generatedAt,
    } as const;

    expect(generateWorldAtlas(input)).toEqual(generateWorldAtlas(input));
  });

  it("creates a readable full-world atlas without overwhelming the map", () => {
    const atlas = generateWorldAtlas({
      seed: "atlas-shape-test",
      title: "Atlas Shape Test",
      templateId: "dangerous-frontier",
      styleIds: ["exploration", "west-marches", "dungeon-crawl"],
      generatedAt,
    });

    expect(isWorldAtlasDocument(atlas)).toBe(true);
    expect(atlas.generatorVersion).toBe(WORLD_ATLAS_GENERATOR_VERSION);
    expect(WORLD_ATLAS_GENERATOR_VERSION).toBe("campaign-atlas-v2");
    expect(atlas.widthMiles).toBeGreaterThan(10_000);
    expect(atlas.heightMiles).toBeGreaterThan(6_000);
    expect(atlas.landmasses.length).toBeGreaterThanOrEqual(4);
    expect(atlas.regions.length).toBeGreaterThan(10);
    expect(atlas.mountainRanges.length).toBeGreaterThanOrEqual(4);
    expect(atlas.rivers.length).toBeGreaterThanOrEqual(8);
    expect(atlas.places.length).toBeGreaterThan(60);
    expect(atlas.places.length).toBeLessThan(130);
    expect(atlas.paths.length).toBeGreaterThan(30);
    expect(atlas.paths.length).toBeLessThan(140);
    expect(atlas.legend.length).toBeGreaterThan(8);
    expect(atlas.northUp).toBe(true);
    expect(atlas.landmasses.every((landmass) => landmass.points.length >= 64)).toBe(true);
  });

  it("keeps land roads on their own landmass and uses sea routes between landmasses", () => {
    const atlas = generateWorldAtlas({
      seed: "route-topology-test",
      title: "Route Topology Test",
      templateId: "isles-and-seas",
      styleIds: ["seafaring", "pirates"],
      generatedAt,
    });
    const places = new Map(atlas.places.map((place) => [place.id, place] as const));

    for (const path of atlas.paths) {
      const from = places.get(path.fromPlaceId);
      const to = places.get(path.toPlaceId);
      expect(from).toBeDefined();
      expect(to).toBeDefined();
      if (!from || !to) continue;
      if (path.kind === "road" || path.kind === "trail") {
        expect(from.landmassId).toBe(to.landmassId);
      }
      if (path.kind === "sea-route") {
        expect(from.kind).toBe("port");
        expect(to.kind).toBe("port");
        expect(from.landmassId).not.toBe(to.landmassId);
      }
    }
  });

  it("uses campaign decisions to bias the kinds of places in the generated world", () => {
    const maritime = generateWorldAtlas({
      seed: "style-bias-test",
      title: "Maritime",
      templateId: "isles-and-seas",
      styleIds: ["seafaring", "pirates"],
      generatedAt,
    });
    const frontier = generateWorldAtlas({
      seed: "style-bias-test",
      title: "Frontier",
      templateId: "dangerous-frontier",
      styleIds: ["exploration", "wilderness"],
      generatedAt,
    });

    const maritimePorts = maritime.places.filter((place) => place.kind === "port").length;
    const frontierPorts = frontier.places.filter((place) => place.kind === "port").length;
    const frontierRuins = frontier.places.filter((place) => place.kind === "ruin").length;
    const maritimeRuins = maritime.places.filter((place) => place.kind === "ruin").length;

    expect(maritimePorts).toBeGreaterThan(frontierPorts);
    expect(frontierRuins).toBeGreaterThan(maritimeRuins);
  });

  it("adds planar sites when campaign decisions call for them", () => {
    const atlas = generateWorldAtlas({
      seed: "planar-test",
      title: "Planar Test",
      styleIds: ["planar"],
      multiPlanar: true,
      epic: true,
      generatedAt,
    });

    expect(atlas.places.some((place) => place.kind === "planar-gate")).toBe(true);
  });

  it("renders an illustrated SVG atlas with cartographic furniture", () => {
    const atlas = generateWorldAtlas({
      seed: "render-test",
      title: "Render Test",
      styleIds: ["high-fantasy"],
      generatedAt,
    });
    const svg = renderWorldAtlasSvg(atlas);

    expect(svg).toContain("<svg");
    expect(svg).toContain("LEGEND");
    expect(svg).toContain("miles");
    expect(svg).toContain(">N<");
    expect(svg).toContain("Render Test");
  });

  it("creates stable normalized vectors for Vectorize indexing", () => {
    const first = hashedAtlasEmbedding("ancient ruined dwarven citadel necromancy");
    const second = hashedAtlasEmbedding("ancient ruined dwarven citadel necromancy");
    expect(first).toEqual(second);
    expect(first).toHaveLength(64);
    const magnitude = Math.sqrt(first.reduce((sum, value) => sum + value * value, 0));
    expect(magnitude).toBeCloseTo(1, 5);
  });
});
