import { describe, expect, it, vi } from "vitest";
import {
  generateHybridCampaignWorldAtlas,
  HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION,
  storedAIPlan,
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

describe("hybrid campaign atlas", () => {
  it("lets AI plan themes while the deterministic engine owns the actual map", async () => {
    const run = vi.fn(async () => ({ response: JSON.stringify(plan) }));
    const atlas = await generateHybridCampaignWorldAtlas({
      env: {
        AI: { run },
        AI_GAME_MODEL: "@cf/google/gemma-4-26b-a4b-it",
      },
      request: request(),
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(atlas.generatorVersion).toBe(HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION);
    expect(atlas.landmasses).toHaveLength(1);
    expect(atlas.landmasses[0]?.name).toBe("Edravar");
    expect(atlas.landmasses[0]?.biome).toBe("forest");
    expect(atlas.regions.some((region) => region.name === "The Gloam March")).toBe(true);
    expect(atlas.places.some((place) => place.name === "Vile Academy")).toBe(true);

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
  });

  it("reuses a stored AI brief for deterministic same-seed regeneration", async () => {
    const initial = await generateHybridCampaignWorldAtlas({
      env: {
        AI: { run: async () => ({ response: JSON.stringify(plan) }) },
        AI_GAME_MODEL: "@cf/google/gemma-4-26b-a4b-it",
      },
      request: request(),
    });
    const savedPlan = storedAIPlan(initial);
    expect(savedPlan).not.toBeNull();

    const run = vi.fn(async () => {
      throw new Error("AI should not be called when a saved same-seed plan exists");
    });
    const regenerated = await generateHybridCampaignWorldAtlas({
      env: {
        AI: { run },
        AI_GAME_MODEL: "@cf/google/gemma-4-26b-a4b-it",
      },
      request: request(),
      existingPlan: savedPlan,
    });

    expect(run).not.toHaveBeenCalled();
    expect(regenerated.landmasses).toEqual(initial.landmasses);
    expect(regenerated.regions).toEqual(initial.regions);
    expect(regenerated.places).toEqual(initial.places);
    expect(regenerated.paths).toEqual(initial.paths);
  });
});
