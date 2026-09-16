import { describe, expect, it, vi } from "vitest";
import {
  generateHybridCampaignWorldAtlas,
  HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION,
  storedAIPlan,
  storedAIRealismAudit,
} from "@/modules/worlds/server/hybridCampaignAtlas";

function request() {
  return {
    campaign: {
      name: "The Vile Academy",
      description: "A dark inland academy campaign surrounded by dangerous wilderness.",
      settings: {
        creatorVersion: 2,
        genres: ["dark-fantasy", "exploration"],
        structure: "hexcrawl",
        scale: "heroic",
        pace: "standard",
        world: {
          mode: "generated",
          templateId: "dangerous-frontier",
          multiPlanar: false,
          persistentWorld: true,
        },
        dm: {
          difficulty: "challenging",
          creativity: "inventive",
        },
      },
    },
    seed: "hybrid-world-seed",
    generatedAt: "2026-09-15T00:00:00.000Z",
  } as const;
}

const plan = {
  geography: "supercontinent",
  dominantBiomes: ["forest", "highlands", "temperate"],
  worldSummary: "A vast inland realm of old forests, mountain watersheds, and isolated schools of forbidden magic.",
  terrainThemes: ["forested watersheds", "high mountain divides", "broad inland valleys"],
  continentNames: ["Edravar"],
  regionNames: ["The Gloam March", "High Veyr", "The Alder Reach", "Mournvale"],
  settlementNames: ["Vile Academy", "Greywatch", "Alderfall", "Karthmere", "Dun Ravel"],
  landmarkNames: ["The Black Stair", "Saintless Tor", "The Hollow Crown"],
} as const;

const realismAudit = {
  realismScore: 68,
  settlementSpacingMultiplier: 1.65,
  maxCitiesPerLandmass: 2,
  maxTownsPerLandmass: 4,
  maxPortsPerLandmass: 1,
  maxFortificationsPerLandmass: 3,
  maxVillagesPerLandmass: 7,
  maxHamletsPerLandmass: 5,
  routeDensity: "sparse",
  wildernessSiteTrailThreshold: 0.78,
  biomeCorrections: [
    {
      scope: "region",
      index: 0,
      biome: "forest",
      reason: "The academy's core region should remain humid forest rather than an isolated dry biome.",
    },
  ],
  findings: [
    "Major population centers were too dense for a frontier-scale world.",
    "Long-distance routes should be sparse trunks with wilderness between them.",
  ],
} as const;

describe("hybrid campaign atlas", () => {
  it("uses AI for creative planning and a second realism audit while the engine owns coordinates", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ response: JSON.stringify(plan) })
      .mockResolvedValueOnce({ response: JSON.stringify(realismAudit) });
    const atlas = await generateHybridCampaignWorldAtlas({
      env: {
        AI: { run },
        AI_GAME_MODEL: "@cf/google/gemma-4-26b-a4b-it",
      },
      request: request(),
    });

    expect(run).toHaveBeenCalledTimes(2);
    expect(atlas.generatorVersion).toBe(HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION);
    expect(atlas.landmasses).toHaveLength(1);
    expect(atlas.landmasses[0]?.name).toBe("Edravar");
    expect(atlas.landmasses[0]?.biome).toBe("forest");
    expect(atlas.regions.some((region) => region.name === "The Gloam March")).toBe(true);
    expect(atlas.places.some((place) => place.name === "Vile Academy")).toBe(true);

    const localPlaces = atlas.places.filter(
      (place) => place.landmassId === atlas.landmasses[0]?.id,
    );
    expect(localPlaces.filter((place) => place.kind === "city")).toHaveLength(
      Math.min(2, localPlaces.filter((place) => place.kind === "city").length),
    );
    expect(localPlaces.filter((place) => place.kind === "city").length).toBeLessThanOrEqual(2);
    expect(localPlaces.filter((place) => place.kind === "town").length).toBeLessThanOrEqual(4);
    expect(localPlaces.filter((place) => place.kind === "port").length).toBeLessThanOrEqual(1);

    // AI never supplies coordinates: every place still has numeric coordinates
    // produced by the engine, and every route points at real engine entities.
    expect(atlas.places.every((place) => Number.isFinite(place.x) && Number.isFinite(place.y))).toBe(true);
    const placeIds = new Set(atlas.places.map((place) => place.id));
    expect(
      atlas.paths.every(
        (path) => placeIds.has(path.fromPlaceId) && placeIds.has(path.toPlaceId),
      ),
    ).toBe(true);

    expect(storedAIPlan(atlas)).toMatchObject({
      geography: "supercontinent",
      dominantBiomes: ["forest", "highlands", "temperate"],
    });
    expect(storedAIRealismAudit(atlas)).toMatchObject({
      realismScore: 68,
      settlementSpacingMultiplier: 1.65,
      routeDensity: "sparse",
    });
  });

  it("reuses the stored AI plan and realism audit for deterministic same-seed regeneration", async () => {
    const initialRun = vi
      .fn()
      .mockResolvedValueOnce({ response: JSON.stringify(plan) })
      .mockResolvedValueOnce({ response: JSON.stringify(realismAudit) });
    const initial = await generateHybridCampaignWorldAtlas({
      env: {
        AI: { run: initialRun },
        AI_GAME_MODEL: "@cf/google/gemma-4-26b-a4b-it",
      },
      request: request(),
    });
    const savedPlan = storedAIPlan(initial);
    const savedAudit = storedAIRealismAudit(initial);
    expect(savedPlan).not.toBeNull();
    expect(savedAudit).not.toBeNull();

    const run = vi.fn(async () => {
      throw new Error("AI should not be called when the saved plan and audit are reused");
    });
    const regenerated = await generateHybridCampaignWorldAtlas({
      env: {
        AI: { run },
        AI_GAME_MODEL: "@cf/google/gemma-4-26b-a4b-it",
      },
      request: request(),
      existingPlan: savedPlan,
      existingAudit: savedAudit,
    });

    expect(run).not.toHaveBeenCalled();
    expect(regenerated.landmasses).toEqual(initial.landmasses);
    expect(regenerated.regions).toEqual(initial.regions);
    expect(regenerated.places).toEqual(initial.places);
    expect(regenerated.paths).toEqual(initial.paths);
  });
});
