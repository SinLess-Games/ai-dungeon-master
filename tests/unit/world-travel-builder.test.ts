import { describe, expect, it } from "vitest";
import type { WorldAtlasDocument } from "@/modules/worlds/domain/atlas";
import {
  calculateDnd35TravelTiming,
  dnd35TerrainMultiplier,
  planAtlasRoute,
  travelEncounterPolicy,
  weatherMovementMultiplier,
} from "@/modules/worlds/domain/travel";
import { applyWorldAtlasEdit } from "@/modules/worlds/domain/worldBuilder";

function atlasFixture(): WorldAtlasDocument {
  return {
    atlasVersion: 1,
    generatorVersion: "test",
    title: "Travel Test World",
    seed: "travel-test",
    widthMiles: 1000,
    heightMiles: 600,
    northUp: true,
    landmasses: [
      {
        id: "land-1",
        name: "Testland",
        points: [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
          { x: 1000, y: 600 },
          { x: 0, y: 600 },
        ],
        center: { x: 500, y: 300 },
        radiusX: 500,
        radiusY: 300,
        biome: "temperate",
      },
    ],
    regions: [
      {
        id: "region-plains",
        landmassId: "land-1",
        name: "Open Vale",
        center: { x: 150, y: 200 },
        biome: "temperate",
        importance: 0.8,
      },
      {
        id: "region-hills",
        landmassId: "land-1",
        name: "Broken Hills",
        center: { x: 800, y: 200 },
        biome: "highlands",
        importance: 0.8,
      },
    ],
    mountainRanges: [],
    rivers: [],
    places: [
      {
        id: "a",
        landmassId: "land-1",
        regionId: "region-plains",
        name: "A",
        kind: "town",
        x: 100,
        y: 200,
        importance: 1,
        description: "A",
        tags: [],
      },
      {
        id: "b",
        landmassId: "land-1",
        regionId: "region-plains",
        name: "B",
        kind: "town",
        x: 450,
        y: 200,
        importance: 1,
        description: "B",
        tags: [],
      },
      {
        id: "c",
        landmassId: "land-1",
        regionId: "region-hills",
        name: "C",
        kind: "town",
        x: 800,
        y: 200,
        importance: 1,
        description: "C",
        tags: [],
      },
    ],
    paths: [
      {
        id: "direct",
        kind: "road",
        fromPlaceId: "a",
        toPlaceId: "c",
        distanceMiles: 10,
        points: [
          { x: 100, y: 200 },
          { x: 800, y: 200 },
        ],
      },
      {
        id: "via-b-1",
        kind: "road",
        fromPlaceId: "a",
        toPlaceId: "b",
        distanceMiles: 5,
        points: [
          { x: 100, y: 200 },
          { x: 450, y: 200 },
        ],
      },
      {
        id: "via-b-2",
        kind: "road",
        fromPlaceId: "b",
        toPlaceId: "c",
        distanceMiles: 5,
        points: [
          { x: 450, y: 200 },
          { x: 800, y: 200 },
        ],
      },
      {
        id: "sea-only",
        kind: "sea-route",
        fromPlaceId: "a",
        toPlaceId: "b",
        distanceMiles: 1,
        points: [
          { x: 100, y: 200 },
          { x: 450, y: 200 },
        ],
      },
    ],
    legend: [
      { kind: "town", label: "Town" },
      { kind: "road", label: "Road" },
      { kind: "sea-route", label: "Sea Route" },
    ],
    campaignDecisions: {
      templateId: null,
      styleIds: [],
      structure: null,
      scale: null,
      pace: null,
      multiPlanar: false,
      epic: false,
    },
    metadata: {
      generatedAt: "2026-09-15T00:00:00.000Z",
      artDirection: "illustrated-fantasy-atlas",
      renderStatus: "ready",
    },
  };
}

describe("D&D 3.5 campaign travel", () => {
  it("uses the 3.5 normal walking rate of 30 feet = 3 mph = 24 miles in 8 hours", () => {
    const atlas = atlasFixture();
    const route = planAtlasRoute(atlas, "a", "b");
    expect(route).not.toBeNull();
    const timing = calculateDnd35TravelTiming({
      route: {
        ...route!,
        distanceMiles: 24,
        equivalentMiles: 24,
        terrainMultiplier: 1,
      },
      partySpeedFeet: 30,
      weather: "clear",
    });
    expect(timing.milesPerHour).toBe(3);
    expect(timing.travelMinutes).toBe(480);
    expect(timing.elapsedClockMinutes).toBe(480);
    expect(timing.travelDays).toBe(1);
  });

  it("applies D&D 3.5 road/trail terrain multipliers", () => {
    expect(dnd35TerrainMultiplier("plains", "road-or-trail")).toBe(1);
    expect(dnd35TerrainMultiplier("hills", "road-or-trail")).toBe(0.75);
    expect(dnd35TerrainMultiplier("jungle", "road-or-trail")).toBe(0.75);
    expect(dnd35TerrainMultiplier("jungle", "trackless")).toBe(0.25);
  });

  it("chooses the fastest terrain-adjusted land route and ignores sea routes", () => {
    const route = planAtlasRoute(atlasFixture(), "a", "c");
    expect(route).not.toBeNull();
    expect(route?.pathIds).toEqual(["via-b-1", "via-b-2"]);
    expect(route?.distanceMiles).toBe(10);
    expect(route?.terrainMultiplier).toBeCloseTo(10 / (5 + 5 / 0.75), 5);
  });

  it("adds overnight non-travel time after more than eight hours of walking", () => {
    const route = planAtlasRoute(atlasFixture(), "a", "c");
    expect(route).not.toBeNull();
    const timing = calculateDnd35TravelTiming({
      route: {
        ...route!,
        distanceMiles: 24,
        equivalentMiles: 32,
        terrainMultiplier: 0.75,
      },
      partySpeedFeet: 30,
      weather: "clear",
    });
    expect(timing.travelMinutes).toBe(640);
    expect(timing.travelDays).toBe(2);
    expect(timing.overnightRestMinutes).toBe(960);
    expect(timing.elapsedClockMinutes).toBe(1600);
  });

  it("applies concrete snow movement costs without inventing a rain speed penalty", () => {
    expect(weatherMovementMultiplier("snow")).toBe(0.5);
    expect(weatherMovementMultiplier("heavy-snow")).toBe(0.25);
    expect(weatherMovementMultiplier("blizzard")).toBe(0.25);
    expect(weatherMovementMultiplier("rain")).toBe(1);
    expect(weatherMovementMultiplier("fog")).toBe(1);
  });

  it("keeps travel encounter chance an explicit Endless Codex policy", () => {
    const route = planAtlasRoute(atlasFixture(), "a", "c");
    expect(route).not.toBeNull();
    const normal = travelEncounterPolicy({ route: route!, weather: "clear", travelMinutes: 480 });
    const severe = travelEncounterPolicy({ route: route!, weather: "blizzard", travelMinutes: 480 });
    expect(normal.checks).toBe(2);
    expect(severe.threshold).toBeGreaterThan(normal.threshold);
    expect(severe.threshold).toBeLessThanOrEqual(35);
  });
});

describe("manual campaign atlas editing", () => {
  it("creates, moves, edits, and deletes a place while maintaining connected paths", () => {
    let atlas = atlasFixture();
    atlas = applyWorldAtlasEdit(atlas, {
      type: "place.create",
      id: "gm-place",
      name: "GM Keep",
      kind: "fort",
      x: 300,
      y: 250,
      description: "A manually placed keep.",
      tags: ["gm-created"],
    });
    expect(atlas.places.some((place) => place.id === "gm-place")).toBe(true);

    atlas = applyWorldAtlasEdit(atlas, {
      type: "path.create",
      id: "gm-path",
      kind: "road",
      fromPlaceId: "a",
      toPlaceId: "gm-place",
    });
    const beforeDistance = atlas.paths.find((path) => path.id === "gm-path")?.distanceMiles;
    expect(beforeDistance).toBeGreaterThan(0);

    atlas = applyWorldAtlasEdit(atlas, {
      type: "place.move",
      placeId: "gm-place",
      x: 600,
      y: 350,
    });
    const moved = atlas.places.find((place) => place.id === "gm-place");
    expect(moved?.x).toBe(600);
    expect(atlas.paths.find((path) => path.id === "gm-path")?.distanceMiles).not.toBe(beforeDistance);

    atlas = applyWorldAtlasEdit(atlas, {
      type: "place.update",
      placeId: "gm-place",
      name: "Iron Keep",
      population: 450,
    });
    expect(atlas.places.find((place) => place.id === "gm-place")?.name).toBe("Iron Keep");
    expect(atlas.places.find((place) => place.id === "gm-place")?.population).toBe(450);

    atlas = applyWorldAtlasEdit(atlas, { type: "place.delete", placeId: "gm-place" });
    expect(atlas.places.some((place) => place.id === "gm-place")).toBe(false);
    expect(atlas.paths.some((path) => path.id === "gm-path")).toBe(false);
  });

  it("can create, move, edit, and delete regions", () => {
    let atlas = atlasFixture();
    atlas = applyWorldAtlasEdit(atlas, {
      type: "region.create",
      id: "gm-region",
      name: "GM March",
      biome: "swamp",
      x: 500,
      y: 300,
      importance: 0.7,
    });
    expect(atlas.regions.some((region) => region.id === "gm-region")).toBe(true);

    atlas = applyWorldAtlasEdit(atlas, {
      type: "region.update",
      regionId: "gm-region",
      name: "Black March",
      biome: "badlands",
    });
    expect(atlas.regions.find((region) => region.id === "gm-region")?.name).toBe("Black March");

    atlas = applyWorldAtlasEdit(atlas, {
      type: "region.move",
      regionId: "gm-region",
      x: 650,
      y: 320,
    });
    expect(atlas.regions.find((region) => region.id === "gm-region")?.center.x).toBe(650);

    atlas = applyWorldAtlasEdit(atlas, { type: "region.delete", regionId: "gm-region" });
    expect(atlas.regions.some((region) => region.id === "gm-region")).toBe(false);
    expect(atlas.metadata.renderStatus).toBe("pending");
  });
});
