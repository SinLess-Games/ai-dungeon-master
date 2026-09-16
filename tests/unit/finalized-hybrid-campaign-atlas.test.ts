import { describe, expect, it, vi } from "vitest";
import {
  FINALIZED_HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION,
  generateHybridCampaignWorldAtlas,
} from "@/modules/worlds/server/finalizedHybridCampaignAtlas";

const request = {
  campaign: {
    name: "The Vile Academy",
    description: "A dark inland academy campaign in a believable old fantasy world.",
    settings: {
      creatorVersion: 2,
      genres: ["dark-fantasy", "exploration"],
      structure: "hexcrawl",
      scale: "heroic",
      pace: "standard",
      world: {
        mode: "generated",
        templateId: "balanced-realms",
        multiPlanar: false,
        persistentWorld: true,
      },
      rules: { epicLevels: false },
      dm: { difficulty: "challenging", creativity: "inventive" },
    },
    context: {
      playMode: "solo",
      gameMasterMode: "ai",
      rulesetId: "dnd35",
      rulesetVersion: "3.5",
      notes: "The academy sits above older magical ruins.",
    },
  },
  seed: "ai-fantasy-seed",
  generatedAt: "2026-09-16T00:00:00.000Z",
} as const;

const geometry = {
  widthMiles: 8000,
  heightMiles: 5000,
  landmasses: [
    {
      name: "Edravar",
      points: [
        { x: 400, y: 700 },
        { x: 1000, y: 470 },
        { x: 1600, y: 350 },
        { x: 3100, y: 300 },
        { x: 4700, y: 500 },
        { x: 6200, y: 900 },
        { x: 6800, y: 1350 },
        { x: 7100, y: 1900 },
        { x: 6900, y: 3200 },
        { x: 5700, y: 4100 },
        { x: 4100, y: 4550 },
        { x: 2400, y: 4400 },
        { x: 900, y: 3600 },
        { x: 300, y: 2200 },
      ],
      center: { x: 3650, y: 2400 },
      radiusX: 3400,
      radiusY: 2100,
      biome: "temperate",
    },
  ],
  regions: [
    { landmassIndex: 0, name: "Northwood", center: { x: 2500, y: 1200 }, biome: "forest", importance: 0.7 },
    { landmassIndex: 0, name: "High Veyr", center: { x: 4300, y: 1400 }, biome: "highlands", importance: 0.8 },
    { landmassIndex: 0, name: "Alder Reach", center: { x: 2600, y: 3000 }, biome: "temperate", importance: 0.6 },
    { landmassIndex: 0, name: "South March", center: { x: 5000, y: 3300 }, biome: "steppe", importance: 0.5 },
  ],
  mountainRanges: [
    { landmassIndex: 0, name: "Crownspine", points: [{ x: 3300, y: 900 }, { x: 3900, y: 1400 }, { x: 4500, y: 1900 }] },
  ],
  rivers: [
    { landmassIndex: 0, name: "Veyrflow", points: [{ x: 3900, y: 1450 }, { x: 3600, y: 2200 }, { x: 3000, y: 3000 }, { x: 1800, y: 3900 }] },
  ],
};

const inhabited = {
  places: [
    { landmassIndex: 0, regionIndex: 2, name: "Vile Academy", kind: "city", x: 2800, y: 2920, importance: 1, population: 38000, description: "An old academy city above sealed magical ruins beside the Veyrflow.", tags: ["academy", "arcane"] },
    { landmassIndex: 0, regionIndex: 0, name: "Greywatch", kind: "town", x: 1900, y: 1450, importance: 0.7, population: 7800, description: "A northern market town.", tags: [] },
    { landmassIndex: 0, regionIndex: 1, name: "Stonegate", kind: "fort", x: 4300, y: 1750, importance: 0.65, population: 2200, description: "A mountain-pass fortress.", tags: [] },
    { landmassIndex: 0, regionIndex: 3, name: "Dun Ravel", kind: "town", x: 5100, y: 3300, importance: 0.68, population: 6500, description: "A southern caravan town.", tags: [] },
    { landmassIndex: 0, regionIndex: 2, name: "Alderfall", kind: "village", x: 2100, y: 3300, importance: 0.45, population: 950, description: "A farming village.", tags: [] },
    { landmassIndex: 0, regionIndex: 0, name: "Pinecross", kind: "village", x: 2600, y: 1100, importance: 0.4, population: 700, description: "A woodland village.", tags: [] },
    { landmassIndex: 0, regionIndex: 1, name: "Black Stair", kind: "ruin", x: 3700, y: 1200, importance: 0.6, description: "Cyclopean ruins in the highlands.", tags: ["ruin", "magical"] },
    { landmassIndex: 0, regionIndex: 3, name: "Ash Well", kind: "landmark", x: 5800, y: 3550, importance: 0.5, description: "A mineral spring in the dry south.", tags: [] },
    { landmassIndex: 0, regionIndex: 2, name: "Hollow Crown", kind: "dungeon", x: 3400, y: 3500, importance: 0.7, description: "A buried royal complex haunted by old magic.", tags: ["dungeon"] },
    { landmassIndex: 0, regionIndex: 0, name: "Ravenmere", kind: "hamlet", x: 1300, y: 1900, importance: 0.3, population: 180, description: "A remote hamlet.", tags: [] },
    { landmassIndex: 0, regionIndex: 1, name: "Iron Delve", kind: "mine", x: 4700, y: 1200, importance: 0.45, description: "An active iron mine.", tags: [] },
    { landmassIndex: 0, regionIndex: 3, name: "Sunscar", kind: "temple", x: 5400, y: 2850, importance: 0.55, description: "A weathered roadside temple.", tags: [] },
  ],
  paths: [
    { kind: "road", fromPlaceIndex: 0, toPlaceIndex: 1, distanceMiles: 1180, points: [{ x: 2800, y: 2920 }, { x: 2400, y: 2200 }, { x: 1900, y: 1450 }] },
    { kind: "road", fromPlaceIndex: 0, toPlaceIndex: 3, distanceMiles: 2350, points: [{ x: 2800, y: 2920 }, { x: 3900, y: 3050 }, { x: 5100, y: 3300 }] },
    { kind: "trail", fromPlaceIndex: 6, toPlaceIndex: 2, distanceMiles: 900, points: [{ x: 3700, y: 1200 }, { x: 4050, y: 1450 }, { x: 4300, y: 1750 }] },
    { kind: "trail", fromPlaceIndex: 8, toPlaceIndex: 4, distanceMiles: 1300, points: [{ x: 3400, y: 3500 }, { x: 2750, y: 3420 }, { x: 2100, y: 3300 }] },
  ],
};

const finalReview = {
  findings: ["The continent, magical sites, settlement hierarchy, and sparse travel network fit the campaign."],
  landmassCorrections: [],
  regionCorrections: [],
  placeCorrections: [],
  pathCorrections: [],
};

describe("production fantasy AI campaign atlas", () => {
  it("uses three AI passes and includes the fantasy campaign context", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ response: JSON.stringify(geometry) })
      .mockResolvedValueOnce({ response: JSON.stringify(inhabited) })
      .mockResolvedValueOnce({ response: JSON.stringify(finalReview) });

    const atlas = await generateHybridCampaignWorldAtlas({
      env: {
        AI: { run },
        AI_GAME_MODEL: "@cf/google/gemma-4-26b-a4b-it",
      },
      request,
    });

    expect(run).toHaveBeenCalledTimes(3);
    expect(atlas.generatorVersion).toBe(FINALIZED_HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION);
    expect(atlas.generatorVersion).toBe("campaign-atlas-v10-ai-fantasy");
    expect(atlas.landmasses).toHaveLength(1);
    expect(atlas.landmasses[0]?.name).toBe("Edravar");
    expect(atlas.places[0]?.name).toBe("Vile Academy");
    expect(atlas.paths[0]?.points).toEqual(inhabited.paths[0]?.points);
    const firstPrompt = (run.mock.calls[0]?.[1] as { messages?: Array<{ content?: string }> } | undefined)?.messages?.[1]?.content ?? "";
    expect(firstPrompt).toContain("FANTASY WORLD");
    expect(firstPrompt).toContain("Dungeons & Dragons 3.5");
    expect(firstPrompt).toContain("gameMasterMode");
    expect(
      (atlas.metadata as typeof atlas.metadata & {
        aiOnlyGeneration?: { fantasyWorld?: boolean; campaignContextIncluded?: boolean; passes?: number };
      }).aiOnlyGeneration,
    ).toMatchObject({ fantasyWorld: true, campaignContextIncluded: true, passes: 3 });
  });
});
