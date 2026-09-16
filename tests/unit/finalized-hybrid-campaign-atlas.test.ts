import { describe, expect, it, vi } from "vitest";
import {
  FINALIZED_HYBRID_CAMPAIGN_ATLAS_GENERATOR_VERSION,
  generateHybridCampaignWorldAtlas,
  storedAIRealismAudit,
} from "@/modules/worlds/server/finalizedHybridCampaignAtlas";
import {
  coastDistanceMiles,
  seaRouteStaysInWater,
} from "@/modules/worlds/domain/coastalAtlasIntegrity";

const request = {
  campaign: {
    name: "The Vile Academy",
    description: "A dark inland academy campaign in a believable old world.",
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
      dm: { difficulty: "challenging", creativity: "inventive" },
    },
  },
  seed: "final-review-seed",
  generatedAt: "2026-09-15T00:00:00.000Z",
} as const;

const plan = {
  geography: "continents",
  dominantBiomes: ["forest", "highlands", "temperate"],
  worldSummary: "Two old continents divided by a broad ocean, with sparse inland powers and a few major ports.",
  terrainThemes: ["mountain watersheds", "old forests", "broad plains"],
  continentNames: ["Edravar", "Mornath"],
  regionNames: ["Gloam March", "High Veyr", "Alder Reach"],
  settlementNames: ["Vile Academy", "Greywatch", "Alderfall", "Dun Ravel"],
  landmarkNames: ["Black Stair", "Hollow Crown"],
};

const firstAudit = {
  realismScore: 82,
  settlementSpacingMultiplier: 1.3,
  maxCitiesPerLandmass: 3,
  maxTownsPerLandmass: 6,
  maxPortsPerLandmass: 2,
  maxFortificationsPerLandmass: 4,
  maxVillagesPerLandmass: 8,
  maxHamletsPerLandmass: 8,
  routeDensity: "balanced",
  wildernessSiteTrailThreshold: 0.7,
  biomeCorrections: [],
  findings: ["Major settlement hierarchy is plausible but can be tightened."],
};

const finalReview = {
  realismScore: 94,
  settlementSpacingMultiplier: 1.6,
  maxCitiesPerLandmass: 2,
  maxTownsPerLandmass: 4,
  maxPortsPerLandmass: 2,
  maxFortificationsPerLandmass: 3,
  maxVillagesPerLandmass: 7,
  maxHamletsPerLandmass: 6,
  routeDensity: "sparse",
  wildernessSiteTrailThreshold: 0.78,
  biomeCorrections: [],
  findings: ["Final map should preserve broad wilderness gaps and sparse trunk roads."],
};

describe("finalized hybrid campaign atlas", () => {
  it("lets AI review the finished map before the engine materializes the final atlas", async () => {
    const run = vi
      .fn()
      .mockResolvedValueOnce({ response: JSON.stringify(plan) })
      .mockResolvedValueOnce({ response: JSON.stringify(firstAudit) })
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
    const stored = storedAIRealismAudit(atlas);
    expect(stored?.settlementSpacingMultiplier).toBe(1.6);
    expect(stored?.routeDensity).toBe("sparse");
    expect(stored?.findings[0]).toContain("[FINAL_MAP_REVIEW]");

    for (const port of atlas.places.filter((place) => place.kind === "port")) {
      expect(coastDistanceMiles(port, atlas)).toBeLessThan(0.000001);
    }
    for (const route of atlas.paths.filter((path) => path.kind === "sea-route")) {
      expect(seaRouteStaysInWater(route, atlas)).toBe(true);
    }
  });
});
