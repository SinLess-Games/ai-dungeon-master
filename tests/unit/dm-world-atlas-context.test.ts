import { describe, expect, it } from "vitest";
import { serializeDmWorldAtlasContext } from "@/modules/campaigns/server/dmWorldAtlasContext";
import { generateCampaignWorldAtlas } from "@/modules/worlds/domain/campaignAtlas";
import {
  createInitialExplorationState,
  withExplorationState,
} from "@/modules/worlds/domain/worldBuilder";

describe("AI DM world atlas context", () => {
  it("includes the authoritative map and current party position", () => {
    const base = generateCampaignWorldAtlas({
      campaign: {
        name: "Atlas Context Test",
        description: "A continental campaign used to verify Dungeon Master map context.",
        settings: {
          genres: ["high-fantasy", "exploration"],
          structure: "open-world",
          scale: "heroic",
          pace: "moderate",
          world: {
            templateId: "balanced-realms",
            multiPlanar: false,
          },
        },
      },
      seed: "dm-world-atlas-context-test",
      generatedAt: "2026-09-15T00:00:00.000Z",
    });

    const initial = createInitialExplorationState(base);
    const destination = base.places.find((place) => place.id !== initial.partyPosition.placeId);
    expect(destination).toBeDefined();
    if (!destination) return;

    const atlas = withExplorationState(base, {
      ...initial,
      discoveredPlaceIds: [initial.partyPosition.placeId, destination.id],
      discoveredRegionIds: destination.regionId ? [destination.regionId] : [],
      partyPosition: {
        placeId: destination.id,
        x: destination.x,
        y: destination.y,
      },
      weather: "rain",
      campaignMinutes: 480,
    });

    const context = serializeDmWorldAtlasContext(atlas, 12);

    expect(context).toContain("AUTHORITATIVE WORLD ATLAS");
    expect(context).toContain("regardless of player fog-of-war");
    expect(context).toContain(destination.id);
    expect(context).toContain(destination.name);
    expect(context).toContain('"weather":"rain"');
    expect(context).toContain('"campaignMinutes":480');
    expect(context).toContain('"revision":12');
    expect(context).toContain('"landmasses"');
    expect(context).toContain('"regions"');
    expect(context).toContain('"places"');
    expect(context).toContain('"routes"');
  });
});
