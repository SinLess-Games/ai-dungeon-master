import {
  generateWorldAtlas,
  type AtlasBiome,
  type AtlasLandmass,
  type AtlasPath,
  type AtlasPathKind,
  type AtlasPlace,
  type AtlasPoint,
  type WorldAtlasDocument,
  type WorldAtlasGenerationInput,
} from "./atlas";

export const CAMPAIGN_ATLAS_GENERATOR_VERSION = "campaign-atlas-v3";

type GeographyMode = "archipelago" | "supercontinent" | "continents";

export interface CampaignAtlasSource {
  name: string;
  description?: string | null;
  settings?: unknown;
}

export interface CampaignAtlasRequest {
  campaign: CampaignAtlasSource;
  seed: string;
  generatedAt?: string;
}

export interface CampaignAtlasProfile {
  input: WorldAtlasGenerationInput;
  geographyMode: GeographyMode;
  description: string;
  difficulty: string | null;
  creativity: string | null;
}

interface Layout {
  center: AtlasPoint;
  radiusX: number;
  radiusY: number;
}

interface SourceTransform {
  source: AtlasLandmass;
  targetId: string;
  center: AtlasPoint;
  radiusX: number;
  radiusY: number;
}

const SETTLEMENT_KINDS = new Set([
  "capital",
  "city",
  "town",
  "village",
  "hamlet",
  "port",
  "fort",
  "castle",
]);

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim()))
    : [];
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed: string, namespace: string): number {
  return hash32(`${seed}:${namespace}`) / 4294967295;
}

function distance(a: AtlasPoint, b: AtlasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pathDistance(points: readonly AtlasPoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1]!, points[index]!);
  }
  return total;
}

function hasAny(values: ReadonlySet<string>, ...items: string[]): boolean {
  return items.some((item) => values.has(item));
}

function campaignText(source: CampaignAtlasSource, styleIds: readonly string[], templateId: string | null, structure: string | null): string {
  return [source.name, source.description ?? "", ...styleIds, templateId ?? "", structure ?? ""]
    .join(" ")
    .toLowerCase();
}

function geographyModeFor(input: {
  source: CampaignAtlasSource;
  styleIds: readonly string[];
  templateId: string | null;
  structure: string | null;
}): GeographyMode {
  const styles = new Set(input.styleIds);
  const text = campaignText(input.source, input.styleIds, input.templateId, input.structure);

  if (
    input.templateId === "isles-and-seas" ||
    hasAny(styles, "seafaring", "pirates") ||
    /\b(archipelago|islands?|isles|oceanic|naval|seafaring|pirates?)\b/.test(text)
  ) {
    return "archipelago";
  }

  if (
    input.templateId === "dangerous-frontier" ||
    ["west-marches", "hexcrawl", "city-campaign", "dungeon-crawl"].includes(input.structure ?? "") ||
    hasAny(styles, "wilderness", "west-marches", "hexcrawl") ||
    /\b(single continent|one continent|supercontinent|landlocked|inland frontier)\b/.test(text)
  ) {
    return "supercontinent";
  }

  return "continents";
}

function biomePool(profile: CampaignAtlasProfile): readonly AtlasBiome[] {
  const styles = new Set(profile.input.styleIds ?? []);
  const text = `${profile.description} ${[...(profile.input.styleIds ?? [])].join(" ")}`.toLowerCase();

  if (/\b(desert|dunes|arid|wasteland)\b/.test(text) || styles.has("post-apocalyptic")) {
    return ["desert", "badlands", "steppe", "highlands", "desert"];
  }
  if (/\b(frozen|arctic|ice|glacier|winter)\b/.test(text)) {
    return ["tundra", "tundra", "highlands", "forest"];
  }
  if (/\b(jungle|tropical|rainforest)\b/.test(text)) {
    return ["jungle", "jungle", "forest", "swamp", "temperate"];
  }
  if (profile.input.templateId === "wild-magic" || hasAny(styles, "high-fantasy", "mythic", "planar")) {
    return ["enchanted", "forest", "highlands", "temperate", "enchanted"];
  }
  if (profile.input.templateId === "ancient-ruins") {
    return ["badlands", "steppe", "highlands", "temperate", "desert"];
  }
  if (profile.input.templateId === "dangerous-frontier" || hasAny(styles, "wilderness", "exploration")) {
    return ["forest", "highlands", "steppe", "temperate", "badlands"];
  }
  if (hasAny(styles, "gothic-horror", "dark-fantasy", "grimdark")) {
    return ["forest", "swamp", "highlands", "badlands", "temperate"];
  }
  if (profile.input.templateId === "isles-and-seas" || hasAny(styles, "seafaring", "pirates")) {
    return ["temperate", "forest", "jungle", "highlands", "swamp"];
  }
  return ["temperate", "forest", "highlands", "steppe", "temperate"];
}

export function campaignAtlasProfileFromCampaign(request: CampaignAtlasRequest): CampaignAtlasProfile {
  const settings = asRecord(request.campaign.settings);
  const rulesetSettings = asRecord(settings["ruleset"]);
  const worldSettings = asRecord(settings["world"]);
  const rulesSettings = asRecord(settings["rules"]);
  const dmSettings = asRecord(settings["dm"]);

  const directStyles = stringArray(settings["genres"]);
  const styleIds = directStyles.length > 0 ? directStyles : stringArray(rulesetSettings["campaignStyleIds"]);
  const templateId =
    optionalString(worldSettings["templateId"]) ?? optionalString(rulesetSettings["worldTemplateId"]);
  const structure = optionalString(settings["structure"]);
  const scale = optionalString(settings["scale"]);
  const pace = optionalString(settings["pace"]) ?? optionalString(rulesetSettings["pace"]);
  const multiPlanar =
    typeof worldSettings["multiPlanar"] === "boolean"
      ? worldSettings["multiPlanar"]
      : rulesetSettings["multiPlanar"] === true;
  const epic =
    typeof rulesSettings["epicLevels"] === "boolean"
      ? rulesSettings["epicLevels"]
      : rulesetSettings["epicLevels"] === true;
  const description = [
    request.campaign.description ?? "",
    optionalString(settings["shortDescription"]) ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const difficulty = optionalString(dmSettings["difficulty"]);
  const creativity = optionalString(dmSettings["creativity"]);

  const input: WorldAtlasGenerationInput = {
    seed: request.seed,
    title: `${request.campaign.name} World`,
    templateId,
    styleIds,
    structure,
    scale,
    pace,
    multiPlanar,
    epic,
    ...(request.generatedAt ? { generatedAt: request.generatedAt } : {}),
  };

  return {
    input,
    geographyMode: geographyModeFor({ source: request.campaign, styleIds, templateId, structure }),
    description,
    difficulty,
    creativity,
  };
}

function continentCount(profile: CampaignAtlasProfile): number {
  if (profile.geographyMode === "supercontinent") return 1;
  if (profile.geographyMode === "archipelago") return 0;
  if (
    profile.input.scale === "epic" ||
    profile.input.templateId === "wild-magic" ||
    profile.creativity === "inventive"
  ) {
    return 3;
  }
  return 2;
}

function continentLayouts(count: number, width: number, height: number, seed: string): Layout[] {
  const jitterX = (seeded(seed, "layout-x") - 0.5) * width * 0.025;
  const jitterY = (seeded(seed, "layout-y") - 0.5) * height * 0.025;
  if (count <= 1) {
    return [
      {
        center: { x: width * 0.5 + jitterX, y: height * 0.5 + jitterY },
        radiusX: width * 0.39,
        radiusY: height * 0.39,
      },
    ];
  }
  if (count === 2) {
    return [
      {
        center: { x: width * 0.28 + jitterX, y: height * 0.48 + jitterY },
        radiusX: width * 0.225,
        radiusY: height * 0.33,
      },
      {
        center: { x: width * 0.72 - jitterX, y: height * 0.51 - jitterY },
        radiusX: width * 0.21,
        radiusY: height * 0.31,
      },
    ];
  }
  return [
    {
      center: { x: width * 0.25 + jitterX, y: height * 0.34 + jitterY },
      radiusX: width * 0.195,
      radiusY: height * 0.245,
    },
    {
      center: { x: width * 0.73 - jitterX, y: height * 0.37 - jitterY },
      radiusX: width * 0.19,
      radiusY: height * 0.23,
    },
    {
      center: { x: width * 0.5, y: height * 0.75 },
      radiusX: width * 0.17,
      radiusY: height * 0.175,
    },
  ];
}

function transformShape(source: AtlasLandmass, layout: Layout): AtlasPoint[] {
  return source.points.map((point) => ({
    x: layout.center.x + ((point.x - source.center.x) / Math.max(1, source.radiusX)) * layout.radiusX,
    y: layout.center.y + ((point.y - source.center.y) / Math.max(1, source.radiusY)) * layout.radiusY,
  }));
}

function zoneOffsets(count: number): Array<{ x: number; y: number }> {
  if (count <= 1) return [{ x: 0, y: 0 }];
  if (count === 2) return [{ x: -0.27, y: 0 }, { x: 0.27, y: 0 }];
  if (count === 3) return [{ x: -0.25, y: -0.18 }, { x: 0.26, y: -0.12 }, { x: 0, y: 0.25 }];
  if (count === 4) {
    return [
      { x: -0.24, y: -0.22 },
      { x: 0.24, y: -0.2 },
      { x: -0.2, y: 0.23 },
      { x: 0.22, y: 0.24 },
    ];
  }
  return [
    { x: -0.28, y: -0.22 },
    { x: 0, y: -0.25 },
    { x: 0.28, y: -0.18 },
    { x: -0.2, y: 0.24 },
    { x: 0.2, y: 0.25 },
    { x: 0, y: 0.05 },
  ];
}

function transformPoint(point: AtlasPoint, transform: SourceTransform): AtlasPoint {
  return {
    x:
      transform.center.x +
      ((point.x - transform.source.center.x) / Math.max(1, transform.source.radiusX)) * transform.radiusX,
    y:
      transform.center.y +
      ((point.y - transform.source.center.y) / Math.max(1, transform.source.radiusY)) * transform.radiusY,
  };
}

function pathKey(leftId: string, rightId: string): string {
  return [leftId, rightId].sort().join(":");
}

function curvedPath(seed: string, kind: AtlasPathKind, from: AtlasPlace, to: AtlasPlace): AtlasPoint[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const perpendicular = { x: -dy / length, y: dx / length };
  const bend = (seeded(seed, `path:${kind}:${pathKey(from.id, to.id)}`) - 0.5) * length * (kind === "sea-route" ? 0.18 : 0.1);
  return [
    { x: from.x, y: from.y },
    {
      x: from.x + dx * 0.35 + perpendicular.x * bend,
      y: from.y + dy * 0.35 + perpendicular.y * bend,
    },
    {
      x: from.x + dx * 0.68 - perpendicular.x * bend * 0.55,
      y: from.y + dy * 0.68 - perpendicular.y * bend * 0.55,
    },
    { x: to.x, y: to.y },
  ];
}

function addPath(
  paths: AtlasPath[],
  seen: Set<string>,
  seed: string,
  kind: AtlasPathKind,
  from: AtlasPlace,
  to: AtlasPlace,
): void {
  const key = pathKey(from.id, to.id);
  if (from.id === to.id || seen.has(key)) return;
  seen.add(key);
  const points = curvedPath(seed, kind, from, to);
  paths.push({
    id: `campaign-path-${kind}-${paths.length + 1}`,
    kind,
    fromPlaceId: from.id,
    toPlaceId: to.id,
    distanceMiles: Math.max(1, Math.round(pathDistance(points))),
    points,
  });
}

function nearestPair(remaining: readonly AtlasPlace[], connected: readonly AtlasPlace[]) {
  let best: { from: AtlasPlace; to: AtlasPlace; miles: number } | null = null;
  for (const from of remaining) {
    for (const to of connected) {
      const miles = distance(from, to);
      if (!best || miles < best.miles) best = { from, to, miles };
    }
  }
  return best;
}

function rebuildPaths(seed: string, places: readonly AtlasPlace[]): AtlasPath[] {
  const paths: AtlasPath[] = [];
  const seen = new Set<string>();
  const landmassIds = [...new Set(places.map((place) => place.landmassId))];

  for (const landmassId of landmassIds) {
    const settlements = places
      .filter((place) => place.landmassId === landmassId && SETTLEMENT_KINDS.has(place.kind))
      .sort((left, right) => right.importance - left.importance);

    if (settlements.length > 1) {
      const connected = [settlements[0]!];
      const remaining = settlements.slice(1);
      while (remaining.length > 0) {
        const pair = nearestPair(remaining, connected);
        if (!pair) break;
        addPath(paths, seen, seed, "road", pair.from, pair.to);
        connected.push(pair.from);
        remaining.splice(remaining.findIndex((place) => place.id === pair.from.id), 1);
      }
    }

    const adventureSites = places.filter(
      (place) =>
        place.landmassId === landmassId &&
        !SETTLEMENT_KINDS.has(place.kind) &&
        place.importance >= 0.48,
    );
    for (const site of adventureSites) {
      const destination = [...settlements].sort(
        (left, right) => distance(site, left) - distance(site, right),
      )[0];
      if (destination) addPath(paths, seen, seed, "trail", site, destination);
    }
  }

  const ports = landmassIds
    .map((landmassId) =>
      places
        .filter((place) => place.landmassId === landmassId && place.kind === "port")
        .sort((left, right) => right.importance - left.importance)[0],
    )
    .filter((place): place is AtlasPlace => Boolean(place));

  if (ports.length > 1) {
    const connected = [ports[0]!];
    const remaining = ports.slice(1);
    while (remaining.length > 0) {
      const pair = nearestPair(remaining, connected);
      if (!pair) break;
      addPath(paths, seen, seed, "sea-route", pair.from, pair.to);
      connected.push(pair.from);
      remaining.splice(remaining.findIndex((place) => place.id === pair.from.id), 1);
    }
  }

  return paths;
}

function reshapeContinents(base: WorldAtlasDocument, profile: CampaignAtlasProfile): WorldAtlasDocument {
  const targetCount = continentCount(profile);
  if (targetCount === 0 || base.landmasses.length <= targetCount) return base;

  const layouts = continentLayouts(targetCount, base.widthMiles, base.heightMiles, base.seed);
  const groups = Array.from({ length: targetCount }, () => [] as AtlasLandmass[]);
  base.landmasses.forEach((landmass, index) => groups[index % targetCount]!.push(landmass));
  const pool = biomePool(profile);
  const transforms = new Map<string, SourceTransform>();

  const landmasses = groups.map((group, targetIndex) => {
    const representative = group[0]!;
    const layout = layouts[targetIndex]!;
    const offsets = zoneOffsets(group.length);
    const zoneScaleX = group.length <= 1 ? 0.72 : group.length === 2 ? 0.39 : 0.31;
    const zoneScaleY = group.length <= 1 ? 0.7 : group.length === 2 ? 0.68 : 0.38;

    group.forEach((source, sourceIndex) => {
      const offset = offsets[sourceIndex % offsets.length]!;
      transforms.set(source.id, {
        source,
        targetId: representative.id,
        center: {
          x: layout.center.x + offset.x * layout.radiusX,
          y: layout.center.y + offset.y * layout.radiusY,
        },
        radiusX: layout.radiusX * zoneScaleX,
        radiusY: layout.radiusY * zoneScaleY,
      });
    });

    return {
      ...representative,
      center: layout.center,
      radiusX: layout.radiusX,
      radiusY: layout.radiusY,
      points: transformShape(representative, layout),
      biome: pool[hash32(`${base.seed}:campaign-biome:${targetIndex}`) % pool.length]!,
    };
  });

  const regions = base.regions.map((region, index) => {
    const transform = transforms.get(region.landmassId)!;
    return {
      ...region,
      landmassId: transform.targetId,
      center: transformPoint(region.center, transform),
      biome:
        index % 2 === 0
          ? pool[hash32(`${base.seed}:region-biome:${region.id}`) % pool.length]!
          : region.biome,
    };
  });

  const mountainRanges = base.mountainRanges.map((range) => {
    const transform = transforms.get(range.landmassId)!;
    return {
      ...range,
      landmassId: transform.targetId,
      points: range.points.map((point) => transformPoint(point, transform)),
    };
  });

  const rivers = base.rivers.map((river) => {
    const transform = transforms.get(river.landmassId)!;
    return {
      ...river,
      landmassId: transform.targetId,
      points: river.points.map((point) => transformPoint(point, transform)),
    };
  });

  const places = base.places.map((place) => {
    const transform = transforms.get(place.landmassId)!;
    const point = transformPoint({ x: place.x, y: place.y }, transform);
    return {
      ...place,
      landmassId: transform.targetId,
      x: point.x,
      y: point.y,
    };
  });

  const paths = rebuildPaths(base.seed, places);
  const usedKinds = new Set<string>([
    ...places.map((place) => place.kind),
    ...paths.map((path) => path.kind),
  ]);

  return {
    ...base,
    landmasses,
    regions,
    mountainRanges,
    rivers,
    places,
    paths,
    legend: base.legend.filter((entry) => usedKinds.has(entry.kind)),
  };
}

export function generateCampaignWorldAtlas(request: CampaignAtlasRequest): WorldAtlasDocument {
  const profile = campaignAtlasProfileFromCampaign(request);
  const base = generateWorldAtlas(profile.input);
  const atlas =
    profile.geographyMode === "archipelago" ? base : reshapeContinents(base, profile);

  return {
    ...atlas,
    generatorVersion: CAMPAIGN_ATLAS_GENERATOR_VERSION,
    metadata: {
      ...atlas.metadata,
      renderStatus: "pending",
    },
  };
}
