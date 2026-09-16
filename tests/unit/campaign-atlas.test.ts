import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_ATLAS_GENERATOR_VERSION,
  campaignAtlasProfileFromCampaign,
  generateCampaignWorldAtlas,
} from "@/modules/worlds/domain/campaignAtlas";

const generatedAt = "2026-09-15T00:00:00.000Z";

function campaign(overrides: {
  name?: string;
  description?: string;
  templateId?: string;
  genres?: string[];
  structure?: string;
  scale?: string;
  pace?: string;
  difficulty?: string;
  creativity?: string;
} = {}) {
  return {
    name: overrides.name ?? "The Vile Academy",
    description: overrides.description ?? "A dangerous academy campaign built around mystery and exploration.",
    settings: {
      genres: overrides.genres ?? ["high-fantasy", "mystery"],
      structure: overrides.structure ?? "open-world",
      scale: overrides.scale ?? "heroic",
      pace: overrides.pace ?? "moderate",
      world: {
        mode: "generated",
        templateId: overrides.templateId ?? "balanced-realms",
        multiPlanar: false,
        persistentWorld: true,
      },
      rules: {
        epicLevels: (overrides.scale ?? "heroic") === "epic",
      },
      dm: {
        difficulty: overrides.difficulty ?? "balanced",
        creativity: overrides.creativity ?? "adaptive",
      },
      ruleset: {
        id: "dnd35",
        version: "3.5",
        worldTemplateId: overrides.templateId ?? "balanced-realms",
        campaignStyleIds: overrides.genres ?? ["high-fantasy", "mystery"],
        pace: overrides.pace ?? "moderate",
        multiPlanar: false,
        epicLevels: (overrides.scale ?? "heroic") === "epic",
      },
    },
  };
}

describe("campaign-aware atlas generation", () => {
  it("extracts the live campaign world profile used by generation", () => {
    const profile = campaignAtlasProfileFromCampaign({
      campaign: campaign({
        templateId: "fractured-kingdoms",
        genres: ["political-intrigue", "war"],
        structure: "war-campaign",
        scale: "paragon",
        pace: "slow",
        difficulty: "challenging",
        creativity: "inventive",
      }),
      seed: "profile-test",
      generatedAt,
    });

    expect(profile.input.templateId).toBe("fractured-kingdoms");
    expect(profile.input.styleIds).toEqual(["political-intrigue", "war"]);
    expect(profile.input.structure).toBe("war-campaign");
    expect(profile.input.scale).toBe("paragon");
    expect(profile.input.pace).toBe("slow");
    expect(profile.difficulty).toBe("challenging");
    expect(profile.creativity).toBe("inventive");
    expect(profile.description).toContain("academy");
  });

  it("does not default a balanced campaign to an archipelago", () => {
    const atlas = generateCampaignWorldAtlas({
      campaign: campaign(),
      seed: "balanced-campaign-test",
      generatedAt,
    });

    expect(atlas.generatorVersion).toBe(CAMPAIGN_ATLAS_GENERATOR_VERSION);
    expect(atlas.generatorVersion).toBe("campaign-atlas-v3");
    expect(atlas.landmasses.length).toBe(2);
    expect(Math.max(...atlas.landmasses.map((landmass) => landmass.radiusX))).toBeGreaterThan(
      atlas.widthMiles * 0.2,
    );
  });

  it("uses one dominant continent for frontier and west-marches campaigns", () => {
    const atlas = generateCampaignWorldAtlas({
      campaign: campaign({
        templateId: "dangerous-frontier",
        genres: ["wilderness", "exploration", "west-marches"],
        structure: "west-marches",
      }),
      seed: "frontier-campaign-test",
      generatedAt,
    });

    expect(atlas.landmasses).toHaveLength(1);
    expect(atlas.landmasses[0]!.radiusX).toBeGreaterThan(atlas.widthMiles * 0.35);
    expect(atlas.paths.some((path) => path.kind === "sea-route")).toBe(false);
  });

  it("only generates an archipelago when the campaign actually calls for one", () => {
    const maritime = generateCampaignWorldAtlas({
      campaign: campaign({
        templateId: "isles-and-seas",
        genres: ["seafaring", "pirates"],
      }),
      seed: "maritime-campaign-test",
      generatedAt,
    });
    const descriptionDriven = generateCampaignWorldAtlas({
      campaign: campaign({
        description: "A chain of isolated islands and rival island kingdoms across an oceanic world.",
        templateId: "balanced-realms",
        genres: ["high-fantasy"],
      }),
      seed: "description-maritime-test",
      generatedAt,
    });

    expect(maritime.landmasses.length).toBeGreaterThanOrEqual(6);
    expect(descriptionDriven.landmasses.length).toBeGreaterThanOrEqual(6);
  });

  it("rebuilds routes so land travel stays on continents and sea routes cross between them", () => {
    const atlas = generateCampaignWorldAtlas({
      campaign: campaign({
        templateId: "fractured-kingdoms",
        genres: ["political-intrigue", "war"],
        structure: "war-campaign",
      }),
      seed: "campaign-route-test",
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
      } else {
        expect(from.landmassId).not.toBe(to.landmassId);
      }
    }
  });
});
