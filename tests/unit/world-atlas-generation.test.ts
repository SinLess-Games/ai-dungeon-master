import { describe, expect, it } from "vitest";
import {
  generateWorldAtlas,
  hashedAtlasEmbedding,
  isWorldAtlasDocument,
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

  it("creates a full planet atlas with geography, places, routes, legend, and physical scale", () => {
    const atlas = generateWorldAtlas({
      seed: "atlas-shape-test",
      title: "Atlas Shape Test",
      templateId: "dangerous-frontier",
      styleIds: ["exploration", "west-marches", "dungeon-crawl"],
      generatedAt,
    });

    expect(isWorldAtlasDocument(atlas)).toBe(true);
    expect(atlas.widthMiles).toBeGreaterThan(10_000);
    expect(atlas.heightMiles).toBeGreaterThan(6_000);
    expect(atlas.landmasses.length).toBeGreaterThanOrEqual(4);
    expect(atlas.regions.length).toBeGreaterThan(10);
    expect(atlas.mountainRanges.length).toBeGreaterThan(4);
    expect(atlas.rivers.length).toBeGreaterThan(8);
    expect(atlas.places.length).toBeGreaterThan(100);
    expect(atlas.paths.length).toBeGreaterThan(20);
    expect(atlas.legend.length).toBeGreaterThan(8);
    expect(atlas.northUp).toBe(true);
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
