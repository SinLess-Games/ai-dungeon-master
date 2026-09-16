import { describe, expect, it } from "vitest";
import {
  generateStrictRealisticCampaignWorldAtlas,
  STRICT_REALISTIC_CAMPAIGN_ATLAS_GENERATOR_VERSION,
  strictSettlementMinimumSpacing,
} from "@/modules/worlds/domain/strictRealisticCampaignAtlas";
import type { AtlasPlace, AtlasPlaceKind, AtlasPoint } from "@/modules/worlds/domain/atlas";

const generatedAt = "2026-09-15T00:00:00.000Z";
const SETTLEMENT_KINDS = new Set<AtlasPlaceKind>([
  "capital",
  "city",
  "town",
  "village",
  "hamlet",
  "port",
  "fort",
  "castle",
]);

function distance(a: AtlasPoint, b: AtlasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function campaign() {
  return {
    name: "The Vile Academy",
    description: "A dangerous academy campaign built around mystery and exploration.",
    settings: {
      genres: ["high-fantasy", "mystery"],
      structure: "open-world",
      scale: "heroic",
      pace: "moderate",
      world: {
        mode: "generated",
        templateId: "balanced-realms",
        multiPlanar: false,
        persistentWorld: true,
      },
      rules: { epicLevels: false },
      dm: { difficulty: "balanced", creativity: "adaptive" },
      ruleset: {
        id: "dnd35",
        version: "3.5",
        worldTemplateId: "balanced-realms",
        campaignStyleIds: ["high-fantasy", "mystery"],
        pace: "moderate",
        multiPlanar: false,
        epicLevels: false,
      },
    },
  };
}

function settlements(places: readonly AtlasPlace[]): AtlasPlace[] {
  return places.filter((place) => SETTLEMENT_KINDS.has(place.kind));
}

describe("strict realistic campaign atlas", () => {
  it("generates a deterministic v5 world for the same campaign seed", () => {
    const input = {
      campaign: campaign(),
      seed: "realistic-vile-academy",
      generatedAt,
    };
    const first = generateStrictRealisticCampaignWorldAtlas(input);
    const second = generateStrictRealisticCampaignWorldAtlas(input);

    expect(first).toEqual(second);
    expect(first.generatorVersion).toBe(STRICT_REALISTIC_CAMPAIGN_ATLAS_GENERATOR_VERSION);
    expect(first.generatorVersion).toBe("campaign-atlas-v5");
    expect(first.landmasses.length).toBeGreaterThan(0);
    expect(first.places.length).toBeGreaterThan(10);
  });

  it("enforces final settlement spacing after continent reshaping", () => {
    const atlas = generateStrictRealisticCampaignWorldAtlas({
      campaign: campaign(),
      seed: "realistic-spacing",
      generatedAt,
    });

    for (const landmass of atlas.landmasses) {
      const local = settlements(atlas.places).filter((place) => place.landmassId === landmass.id);
      for (let leftIndex = 0; leftIndex < local.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < local.length; rightIndex += 1) {
          const left = local[leftIndex]!;
          const right = local[rightIndex]!;
          const required = Math.max(
            strictSettlementMinimumSpacing(landmass, left.kind),
            strictSettlementMinimumSpacing(landmass, right.kind),
          );
          expect(distance(left, right)).toBeGreaterThanOrEqual(required - 0.001);
        }
      }
    }
  });

  it("keeps ports near the coast instead of treating them like inland cities", () => {
    const atlas = generateStrictRealisticCampaignWorldAtlas({
      campaign: campaign(),
      seed: "realistic-port-placement",
      generatedAt,
    });
    const landmasses = new Map(atlas.landmasses.map((landmass) => [landmass.id, landmass] as const));
    const ports = atlas.places.filter((place) => place.kind === "port");

    expect(ports.length).toBeGreaterThan(0);
    for (const port of ports) {
      const landmass = landmasses.get(port.landmassId)!;
      const normalized = Math.hypot(
        (port.x - landmass.center.x) / landmass.radiusX,
        (port.y - landmass.center.y) / landmass.radiusY,
      );
      expect(normalized).toBeGreaterThan(0.58);
    }
  });

  it("keeps roads and trails on land while sea routes connect landmasses", () => {
    const atlas = generateStrictRealisticCampaignWorldAtlas({
      campaign: campaign(),
      seed: "realistic-route-topology",
      generatedAt,
    });
    const places = new Map(atlas.places.map((place) => [place.id, place] as const));

    for (const path of atlas.paths) {
      const from = places.get(path.fromPlaceId);
      const to = places.get(path.toPlaceId);
      expect(from).toBeDefined();
      expect(to).toBeDefined();
      if (!from || !to) continue;

      if (path.kind === "sea-route") {
        expect(from.landmassId).not.toBe(to.landmassId);
      } else {
        expect(from.landmassId).toBe(to.landmassId);
      }
    }
  });

  it("uses a sparse world-scale route network rather than connecting every map node", () => {
    const atlas = generateStrictRealisticCampaignWorldAtlas({
      campaign: campaign(),
      seed: "realistic-sparse-network",
      generatedAt,
    });

    expect(atlas.paths.length).toBeLessThan(atlas.places.length);
  });
});
