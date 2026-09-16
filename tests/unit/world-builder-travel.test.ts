import { describe, expect, it } from "vitest";
import { generateWorldAtlas } from "@/modules/worlds/domain/atlas";
import {
  calculateOverlandTravel,
  dnd35BaseMilesPerDay,
  travelTerrainMultiplier,
} from "@/modules/worlds/domain/overlandTravel";
import {
  applyAtlasEdit,
  commitAtlasTravel,
  createInitialExplorationState,
  findAtlasRoute,
  inspectAtlas,
  planAtlasTravel,
} from "@/modules/worlds/domain/worldBuilder";

function atlas() {
  return generateWorldAtlas({
    seed: "world-builder-travel-test",
    title: "Travel Test",
    templateId: "balanced-realms",
    styleIds: ["high-fantasy"],
    generatedAt: "2026-09-15T00:00:00.000Z",
  });
}

describe("D&D 3.5 overland movement", () => {
  it("matches the core 8-hour daily walking table", () => {
    expect(dnd35BaseMilesPerDay(15)).toBe(12);
    expect(dnd35BaseMilesPerDay(20)).toBe(16);
    expect(dnd35BaseMilesPerDay(30)).toBe(24);
    expect(dnd35BaseMilesPerDay(40)).toBe(32);
  });

  it("applies trackless terrain and weather to travel timing", () => {
    expect(travelTerrainMultiplier("forest")).toBe(0.5);
    const timing = calculateOverlandTravel({
      distanceMiles: 24,
      speedFeet: 30,
      terrain: "forest",
      weather: "rain",
    });
    expect(timing.effectiveMilesPerDay).toBe(9);
    expect(timing.durationMinutes).toBe(1280);
  });
});

describe("world builder editing", () => {
  it("moves a place and keeps connected path endpoints synchronized", () => {
    const world = atlas();
    const path = world.paths[0];
    expect(path).toBeDefined();
    const placeId = path!.fromPlaceId;
    const moved = applyAtlasEdit(world, {
      type: "place.update",
      id: placeId,
      patch: { x: 111, y: 222 },
    });
    const place = moved.places.find((candidate) => candidate.id === placeId);
    const movedPath = moved.paths.find((candidate) => candidate.id === path!.id);
    expect(place?.x).toBe(111);
    expect(place?.y).toBe(222);
    expect(movedPath?.points[0]).toEqual({ x: 111, y: 222 });
    expect(movedPath?.distanceMiles).toBeGreaterThan(0);
  });

  it("inspects broken references", () => {
    const world = atlas();
    const broken = {
      ...world,
      paths: [
        ...world.paths,
        {
          id: "broken-path",
          kind: "road" as const,
          fromPlaceId: "missing-a",
          toPlaceId: "missing-b",
          distanceMiles: 10,
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
          ],
        },
      ],
    };
    expect(inspectAtlas(broken).issues.some((issue) => issue.code === "path.missing_endpoint")).toBe(
      true,
    );
  });
});

describe("campaign exploration and travel", () => {
  it("finds a road/trail route, calculates time, and reveals travelled places", () => {
    const world = atlas();
    const routePath = world.paths.find((path) => path.kind !== "sea-route");
    expect(routePath).toBeDefined();
    const start = world.places.find((place) => place.id === routePath!.fromPlaceId)!;
    const state = {
      ...createInitialExplorationState(world),
      discoveredPlaceIds: [start.id],
      discoveredRegionIds: start.regionId ? [start.regionId] : [],
      partyPosition: { placeId: start.id, x: start.x, y: start.y },
    };
    const route = findAtlasRoute(world, start.id, routePath!.toPlaceId);
    expect(route?.pathIds.length).toBeGreaterThan(0);

    const plan = planAtlasTravel({
      atlas: world,
      state,
      destinationPlaceId: routePath!.toPlaceId,
      speedFeet: 30,
      weather: "clear",
    });
    expect(plan.distanceMiles).toBeGreaterThan(0);
    expect(plan.durationMinutes).toBeGreaterThan(0);

    const next = commitAtlasTravel({
      atlas: world,
      state,
      plan,
      travelId: "travel-1",
      encounterRoll: 0.999,
    });
    expect(next.partyPosition.placeId).toBe(routePath!.toPlaceId);
    expect(next.discoveredPlaceIds).toContain(routePath!.toPlaceId);
    expect(next.campaignMinutes).toBe(plan.durationMinutes);
    expect(next.travelHistory).toHaveLength(1);
  });
});
