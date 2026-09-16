import type { AtlasPlaceKind, WorldAtlasDocument } from "../domain/atlas";

const ROAD_CITY_KINDS = new Set<AtlasPlaceKind>(["capital", "city"]);

function isRoadCity(kind: AtlasPlaceKind): boolean {
  return ROAD_CITY_KINDS.has(kind);
}

/**
 * Enforce the campaign transportation hierarchy after AI generation.
 *
 * Roads are reserved for major urban links: capital/city <-> capital/city.
 * Any AI-authored road touching a town, village, port, fort, castle, temple,
 * dungeon, ruin, mine, cave, landmark, planar gate, etc. is retained as a
 * trail so its authored geometry/connectivity is not lost.
 * Sea routes remain untouched and are validated separately as port-to-port.
 */
export function enforceCityOnlyRoads(atlas: WorldAtlasDocument): WorldAtlasDocument {
  const placesById = new Map(atlas.places.map((place) => [place.id, place] as const));
  let convertedRoads = 0;

  const paths = atlas.paths.map((path) => {
    if (path.kind !== "road") return path;

    const from = placesById.get(path.fromPlaceId);
    const to = placesById.get(path.toPlaceId);
    if (from && to && isRoadCity(from.kind) && isRoadCity(to.kind)) return path;

    convertedRoads += 1;
    return { ...path, kind: "trail" as const };
  });

  return {
    ...atlas,
    paths,
    metadata: {
      ...atlas.metadata,
      aiOnlyGeneration: {
        ...((atlas.metadata as { aiOnlyGeneration?: Record<string, unknown> }).aiOnlyGeneration ?? {}),
        cityOnlyRoads: true,
        nonCityRoadsConvertedToTrails: convertedRoads,
      },
    } as WorldAtlasDocument["metadata"],
  };
}
