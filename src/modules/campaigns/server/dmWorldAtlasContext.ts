/// <reference types="@cloudflare/workers-types" />

import { isWorldAtlasDocument, type WorldAtlasDocument } from "@/modules/worlds/domain/atlas";
import { explorationState } from "@/modules/worlds/domain/worldBuilder";

interface WorldMapRow {
  data: string | unknown;
  revision: number;
}

function parseMapData(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function rounded(value: number): number {
  return Math.round(value);
}

export function serializeDmWorldAtlasContext(atlas: WorldAtlasDocument, revision?: number): string {
  const exploration = explorationState(atlas);
  const currentPlace = atlas.places.find((place) => place.id === exploration.partyPosition.placeId) ?? null;
  const currentRegion = currentPlace?.regionId
    ? atlas.regions.find((region) => region.id === currentPlace.regionId) ?? null
    : null;
  const currentLandmass = currentPlace
    ? atlas.landmasses.find((landmass) => landmass.id === currentPlace.landmassId) ?? null
    : null;

  const compact = {
    title: atlas.title,
    generatorVersion: atlas.generatorVersion,
    ...(revision === undefined ? {} : { revision }),
    dimensionsMiles: [rounded(atlas.widthMiles), rounded(atlas.heightMiles)],
    campaignDecisions: atlas.campaignDecisions,
    party: {
      placeId: exploration.partyPosition.placeId,
      placeName: currentPlace?.name ?? "Unknown",
      placeKind: currentPlace?.kind ?? null,
      coordinates: [rounded(exploration.partyPosition.x), rounded(exploration.partyPosition.y)],
      regionId: currentRegion?.id ?? null,
      regionName: currentRegion?.name ?? null,
      landmassId: currentLandmass?.id ?? null,
      landmassName: currentLandmass?.name ?? null,
      weather: exploration.weather,
      campaignMinutes: exploration.campaignMinutes,
      pendingEncounter: exploration.pendingEncounter,
    },
    landmasses: atlas.landmasses.map((landmass) => [
      landmass.id,
      landmass.name,
      landmass.biome,
      rounded(landmass.center.x),
      rounded(landmass.center.y),
    ]),
    regions: atlas.regions.map((region) => [
      region.id,
      region.name,
      region.landmassId,
      region.biome,
      rounded(region.center.x),
      rounded(region.center.y),
    ]),
    places: atlas.places.map((place) => [
      place.id,
      place.name,
      place.kind,
      place.landmassId,
      place.regionId,
      rounded(place.x),
      rounded(place.y),
      Math.round(place.importance * 100) / 100,
      place.tags,
    ]),
    routes: atlas.paths.map((path) => [
      path.id,
      path.kind,
      path.fromPlaceId,
      path.toPlaceId,
      rounded(path.distanceMiles),
    ]),
  };

  return [
    "AUTHORITATIVE WORLD ATLAS — the Dungeon Master can use the complete map regardless of player fog-of-war.",
    "Map tuple formats: landmass=[id,name,biome,x,y], region=[id,name,landmassId,biome,x,y], place=[id,name,kind,landmassId,regionId,x,y,importance,tags], route=[id,kind,fromPlaceId,toPlaceId,distanceMiles].",
    JSON.stringify(compact),
  ].join("\n");
}

export async function loadDmWorldAtlasContext(
  binding: D1Database,
  campaignId: string,
): Promise<string> {
  try {
    const campaign = await binding
      .prepare(`SELECT world_id AS worldId FROM campaigns WHERE id = ? LIMIT 1`)
      .bind(campaignId)
      .first<{ worldId: string | null }>();
    if (!campaign?.worldId) return "";

    const row = await binding
      .prepare(
        `SELECT data, revision
         FROM world_maps
         WHERE world_id = ? AND kind = 'world'
         ORDER BY updated_at DESC, revision DESC
         LIMIT 1`,
      )
      .bind(campaign.worldId)
      .first<WorldMapRow>();
    if (!row) return "";

    const parsed = parseMapData(row.data);
    if (!isWorldAtlasDocument(parsed)) return "";
    return serializeDmWorldAtlasContext(parsed, row.revision);
  } catch (error) {
    console.error("AI DM world atlas context hydration failed", { campaignId, error });
    return "";
  }
}
