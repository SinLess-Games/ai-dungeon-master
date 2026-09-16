import { describe, expect, it } from "vitest";
import type { WorldAtlasDocument } from "@/modules/worlds/domain/atlas";
import {
  coastDistanceMiles,
  enforceCoastalAtlasIntegrity,
  seaRouteStaysInWater,
} from "@/modules/worlds/domain/coastalAtlasIntegrity";

function square(id: string, name: string, left: number, top: number, right: number, bottom: number) {
  return {
    id,
    name,
    points: [
      { x: left, y: top },
      { x: right, y: top },
      { x: right, y: bottom },
      { x: left, y: bottom },
    ],
    center: { x: (left + right) / 2, y: (top + bottom) / 2 },
    radiusX: (right - left) / 2,
    radiusY: (bottom - top) / 2,
    biome: "temperate" as const,
  };
}

function atlas(): WorldAtlasDocument {
  const left = square("land-left", "Westreach", 50, 120, 250, 480);
  const obstacle = square("land-middle", "Stormwall", 400, 80, 600, 520);
  const right = square("land-right", "Eastreach", 750, 120, 950, 480);
  return {
    atlasVersion: 1,
    generatorVersion: "fixture",
    title: "Coastal Fixture",
    seed: "coastal-fixture",
    widthMiles: 1000,
    heightMiles: 600,
    northUp: true,
    landmasses: [left, obstacle, right],
    regions: [],
    mountainRanges: [],
    rivers: [],
    places: [
      {
        id: "west-port",
        landmassId: left.id,
        regionId: null,
        name: "Westport",
        kind: "port",
        x: 180,
        y: 300,
        importance: 0.9,
        description: "An intentionally inland test port.",
        tags: [],
      },
      {
        id: "east-port",
        landmassId: right.id,
        regionId: null,
        name: "Eastport",
        kind: "port",
        x: 820,
        y: 300,
        importance: 0.9,
        description: "An intentionally inland test port.",
        tags: [],
      },
    ],
    paths: [
      {
        id: "bad-sea-route",
        kind: "sea-route",
        fromPlaceId: "west-port",
        toPlaceId: "east-port",
        distanceMiles: 640,
        points: [
          { x: 180, y: 300 },
          { x: 820, y: 300 },
        ],
      },
    ],
    legend: [{ kind: "port", label: "Port" }, { kind: "sea-route", label: "Sea Route" }],
    campaignDecisions: {
      templateId: "isles-and-seas",
      styleIds: ["seafaring"],
      structure: null,
      scale: null,
      pace: null,
      multiPlanar: false,
      epic: false,
    },
    metadata: {
      generatedAt: "2026-09-15T00:00:00.000Z",
      artDirection: "illustrated-fantasy-atlas",
      renderStatus: "pending",
    },
  };
}

describe("coastal atlas integrity", () => {
  it("snaps ports to the actual coast and routes ships around intervening land", () => {
    const result = enforceCoastalAtlasIntegrity(atlas());
    const ports = result.places.filter((place) => place.kind === "port");
    expect(ports).toHaveLength(2);
    for (const port of ports) expect(coastDistanceMiles(port, result)).toBeLessThan(0.000001);

    const seaRoutes = result.paths.filter((path) => path.kind === "sea-route");
    expect(seaRoutes).toHaveLength(1);
    expect(seaRoutes[0]!.points.length).toBeGreaterThan(2);
    expect(seaRouteStaysInWater(seaRoutes[0]!, result)).toBe(true);
  });
});
