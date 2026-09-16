import { describe, expect, it, vi } from "vitest";
import { generateAICampaignWorldAtlasV2 } from "@/modules/worlds/server/aiOnlyCampaignAtlasV2";

const geometry = {
  widthMiles: 4000,
  heightMiles: 3000,
  landmasses: [
    {
      name: "Averon",
      points: [
        { x: 200, y: 400 }, { x: 600, y: 220 }, { x: 1100, y: 160 }, { x: 1700, y: 190 },
        { x: 2400, y: 260 }, { x: 3100, y: 460 }, { x: 3550, y: 850 }, { x: 3700, y: 1450 },
        { x: 3500, y: 2150 }, { x: 2950, y: 2580 }, { x: 2200, y: 2760 }, { x: 1450, y: 2700 },
        { x: 700, y: 2350 }, { x: 250, y: 1650 },
      ],
      center: { x: 1950, y: 1500 },
      radiusX: 1750,
      radiusY: 1300,
      biome: "temperate",
    },
  ],
  regions: [
    { landmassIndex: 0, name: "North Reach", center: { x: 1100, y: 850 }, biome: "forest", importance: 0.7 },
    { landmassIndex: 0, name: "High March", center: { x: 2600, y: 800 }, biome: "highlands", importance: 0.8 },
    { landmassIndex: 0, name: "Green Vale", center: { x: 1250, y: 2050 }, biome: "temperate", importance: 0.6 },
    { landmassIndex: 0, name: "Southlands", center: { x: 2750, y: 2050 }, biome: "steppe", importance: 0.5 },
  ],
  mountainRanges: [],
  rivers: [],
};

const places = Array.from({ length: 12 }, (_, index) => ({
  landmassIndex: 0,
  regionIndex: index % 4,
  name: `Place ${index + 1}`,
  kind: index === 0 ? "city" : index < 3 ? "town" : "village",
  x: 650 + (index % 4) * 700,
  y: 650 + Math.floor(index / 4) * 650,
  importance: index === 0 ? 1 : 0.5,
  population: index === 0 ? 18000 : 900,
  description: `Fantasy settlement ${index + 1}.`,
  tags: [],
}));

const inhabited = {
  places,
  paths: [
    {
      kind: "road",
      fromPlaceIndex: 0,
      toPlaceIndex: 1,
      distanceMiles: 700,
      points: [{ x: places[0]!.x, y: places[0]!.y }, { x: places[1]!.x, y: places[1]!.y }],
    },
    {
      kind: "sea-route",
      fromPlaceIndex: 1,
      toPlaceIndex: 2,
      distanceMiles: 900,
      points: [{ x: places[1]!.x, y: places[1]!.y }, { x: places[2]!.x, y: places[2]!.y }],
    },
    {
      kind: "trail",
      fromPlaceIndex: 2,
      toPlaceIndex: 3,
      distanceMiles: 180,
      points: [{ x: places[2]!.x, y: places[2]!.y }],
    },
  ],
};

const finalReview = {
  findings: ["Base geography is coherent."],
  landmassCorrections: [],
  regionCorrections: [],
  placeCorrections: [],
  pathCorrections: [
    {
      pathIndex: 0,
      points: [{ x: places[0]!.x, y: places[0]!.y }],
    },
  ],
};

describe("AI-only atlas route tolerance", () => {
  it("drops malformed routes and ignores malformed path corrections instead of failing the world", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ response: JSON.stringify(geometry) })
      .mockResolvedValueOnce({ response: JSON.stringify(inhabited) })
      .mockResolvedValueOnce({ response: JSON.stringify(finalReview) });

    const atlas = await generateAICampaignWorldAtlasV2({
      env: { AI: { run }, AI_GAME_MODEL: "@cf/google/gemma-4-26b-a4b-it" },
      request: {
        campaign: {
          name: "Route Test",
          description: "A grounded D&D 3.5 fantasy realm.",
          settings: {},
        },
        seed: "route-test-seed",
        generatedAt: "2026-09-16T00:00:00.000Z",
      },
    });

    expect(run).toHaveBeenCalledTimes(3);
    expect(atlas.places).toHaveLength(12);
    expect(atlas.paths).toHaveLength(1);
    expect(atlas.paths[0]?.kind).toBe("road");
    expect(atlas.paths[0]?.points).toHaveLength(2);
    expect(atlas.paths.some((path) => path.kind === "sea-route")).toBe(false);
  });
});
