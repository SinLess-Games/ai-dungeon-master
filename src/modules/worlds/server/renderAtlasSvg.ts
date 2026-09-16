import type {
  AtlasBiome,
  AtlasLandmass,
  AtlasPlace,
  AtlasPoint,
  AtlasRegion,
  WorldAtlasDocument,
} from "../domain/atlas";

export const WORLD_ATLAS_RENDERER_VERSION = "satellite-v3-orthographic-landcover";

const BIOME_COLORS: Record<AtlasBiome, string> = {
  temperate: "#667851",
  forest: "#24472e",
  tundra: "#9ba69e",
  desert: "#b39968",
  steppe: "#8b8758",
  swamp: "#3c5544",
  jungle: "#1d4d2b",
  highlands: "#6d685a",
  badlands: "#8c5c47",
  enchanted: "#3e6550",
};

const CULTIVATED_KINDS = new Set([
  "capital",
  "city",
  "town",
  "village",
  "hamlet",
  "port",
]);

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function points(values: readonly AtlasPoint[]): string {
  return values.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shadeHex(hex: string, amount: number): string {
  const source = hex.replace("#", "");
  const value = Number.parseInt(source, 16);
  const channel = (shift: number) =>
    Math.max(0, Math.min(255, ((value >> shift) & 255) + amount));
  return `#${[channel(16), channel(8), channel(0)]
    .map((part) => Math.round(part).toString(16).padStart(2, "0"))
    .join("")}`;
}

function biomeTexture(region: AtlasRegion, index: number): string {
  const color = BIOME_COLORS[region.biome];
  const rx = 430 + region.importance * 560;
  const ry = 300 + region.importance * 430;
  const rotation = hash32(`${region.id}:rotation`) % 180;
  const opacity =
    region.biome === "forest" || region.biome === "jungle"
      ? 0.64
      : region.biome === "desert" || region.biome === "badlands"
        ? 0.5
        : 0.38;
  return `<ellipse cx="${region.center.x.toFixed(1)}" cy="${region.center.y.toFixed(1)}"
    rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"
    transform="rotate(${rotation} ${region.center.x.toFixed(1)} ${region.center.y.toFixed(1)})"
    fill="${color}" opacity="${opacity}" filter="url(#biomeBlend)" data-region="${index}"/>`;
}

function settlementRadius(place: AtlasPlace): number {
  const population = place.population ?? 0;
  const populationScale = population > 0 ? Math.min(1.45, Math.log10(population + 10) / 5) : 0;
  switch (place.kind) {
    case "capital":
      return 52 + place.importance * 34 + populationScale * 22;
    case "city":
      return 38 + place.importance * 28 + populationScale * 18;
    case "port":
      return 34 + place.importance * 24 + populationScale * 16;
    case "town":
      return 22 + place.importance * 18 + populationScale * 12;
    case "village":
      return 11 + place.importance * 10;
    case "hamlet":
      return 7 + place.importance * 6;
    default:
      return 0;
  }
}

function renderCultivatedLand(place: AtlasPlace): string {
  if (!CULTIVATED_KINDS.has(place.kind)) return "";
  const radius = settlementRadius(place);
  if (radius <= 0) return "";
  const random = mulberry32(hash32(`${place.id}:cultivated`));
  const parcels: string[] = [];
  const parcelCount = place.kind === "capital" || place.kind === "city" ? 18 : place.kind === "town" || place.kind === "port" ? 12 : 7;
  for (let index = 0; index < parcelCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const ring = radius * (1.25 + random() * 1.8);
    const x = place.x + Math.cos(angle) * ring;
    const y = place.y + Math.sin(angle) * ring;
    const width = radius * (0.45 + random() * 0.9);
    const height = radius * (0.22 + random() * 0.48);
    const rotation = Math.round(random() * 180);
    const fill = ["#7f8551", "#8d8a57", "#75794b", "#9a8e5f", "#6e794a"][index % 5]!;
    parcels.push(
      `<rect x="${(x - width / 2).toFixed(1)}" y="${(y - height / 2).toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="3" fill="${fill}" opacity=".33" transform="rotate(${rotation} ${x.toFixed(1)} ${y.toFixed(1)})"/>`,
    );
  }
  return `<g opacity=".86">${parcels.join("")}</g>`;
}

function renderUrbanArea(place: AtlasPlace): string {
  if (!CULTIVATED_KINDS.has(place.kind)) return "";
  const radius = settlementRadius(place);
  if (radius <= 0) return "";
  const random = mulberry32(hash32(`${place.id}:urban`));
  const clusters: string[] = [];
  const clusterCount = place.kind === "capital" ? 13 : place.kind === "city" || place.kind === "port" ? 10 : place.kind === "town" ? 7 : 4;
  for (let index = 0; index < clusterCount; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = random() * radius * 0.7;
    const x = place.x + Math.cos(angle) * distance;
    const y = place.y + Math.sin(angle) * distance;
    const rx = radius * (0.28 + random() * 0.32);
    const ry = radius * (0.18 + random() * 0.26);
    const fill = index % 3 === 0 ? "#9b9a8e" : index % 3 === 1 ? "#85867f" : "#aaa698";
    clusters.push(
      `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" opacity=".5"/>`,
    );
  }
  return `<g filter="url(#urbanBlend)">
    <ellipse cx="${place.x.toFixed(1)}" cy="${place.y.toFixed(1)}" rx="${radius.toFixed(1)}" ry="${(radius * 0.72).toFixed(1)}" fill="#8d8f88" opacity=".34"/>
    ${clusters.join("")}
  </g>`;
}

function renderLandmass(
  atlas: WorldAtlasDocument,
  landmass: AtlasLandmass,
  index: number,
): string {
  const base = BIOME_COLORS[landmass.biome];
  const clipId = `land-${index}`;
  const localRegions = atlas.regions.filter((region) => region.landmassId === landmass.id);
  const regions = localRegions.map(biomeTexture).join("\n");
  const seed = (hash32(`${atlas.seed}:${landmass.id}:surface`) % 9000) + 1;
  const localPlaces = atlas.places.filter((place) => place.landmassId === landmass.id);
  const cultivated = localPlaces.map(renderCultivatedLand).join("\n");
  const urban = localPlaces.map(renderUrbanArea).join("\n");

  const mountainRanges = atlas.mountainRanges
    .filter((range) => range.landmassId === landmass.id)
    .map(
      (range) => `<g>
        <polyline points="${points(range.points)}" fill="none" stroke="#1e241f" stroke-width="90" opacity=".16" stroke-linecap="round" stroke-linejoin="round" filter="url(#ridgeBlur)"/>
        <polyline points="${points(range.points)}" fill="none" stroke="#4f5148" stroke-width="48" opacity=".48" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${points(range.points)}" fill="none" stroke="#a4a08d" stroke-width="14" opacity=".25" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`,
    )
    .join("\n");

  const rivers = atlas.rivers
    .filter((river) => river.landmassId === landmass.id)
    .map(
      (river) => `<g>
        <polyline points="${points(river.points)}" fill="none" stroke="#173942" stroke-width="17" opacity=".42" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${points(river.points)}" fill="none" stroke="#4d8595" stroke-width="8" opacity=".82" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`,
    )
    .join("\n");

  const boundsX = (landmass.center.x - landmass.radiusX * 1.15).toFixed(1);
  const boundsY = (landmass.center.y - landmass.radiusY * 1.15).toFixed(1);
  const boundsWidth = (landmass.radiusX * 2.3).toFixed(1);
  const boundsHeight = (landmass.radiusY * 2.3).toFixed(1);

  return `<g>
    <clipPath id="${clipId}"><polygon points="${points(landmass.points)}"/></clipPath>

    <!-- Bright shallow coastal shelf, like true-color orbital imagery. -->
    <polygon points="${points(landmass.points)}" fill="none" stroke="#4e9c91" stroke-width="155" opacity=".18" stroke-linejoin="round"/>
    <polygon points="${points(landmass.points)}" fill="none" stroke="#73bbb0" stroke-width="82" opacity=".22" stroke-linejoin="round"/>
    <polygon points="${points(landmass.points)}" fill="none" stroke="#91cec0" stroke-width="30" opacity=".28" stroke-linejoin="round"/>

    <polygon points="${points(landmass.points)}" fill="${base}" stroke="#395447" stroke-width="2.5" stroke-linejoin="round"/>
    <g clip-path="url(#${clipId})">
      <!-- Broad terrain reflectance/elevation, deliberately low frequency. -->
      <rect x="${boundsX}" y="${boundsY}" width="${boundsWidth}" height="${boundsHeight}"
        fill="${shadeHex(base, 6)}" filter="url(#terrain-${index})" opacity=".52"/>

      <!-- Climate/vegetation land cover. -->
      ${regions}

      <!-- Agricultural mosaic around inhabited places. -->
      ${cultivated}

      <!-- Built-up gray footprint around settlements. -->
      ${urban}

      ${mountainRanges}
      ${rivers}
    </g>
  </g>
  <filter id="terrain-${index}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".00042 .0007" numOctaves="2" seed="${seed}" result="heightRaw"/>
    <feColorMatrix in="heightRaw" type="saturate" values="0" result="height"/>
    <feGaussianBlur in="height" stdDeviation="28" result="smoothHeight"/>
    <feDiffuseLighting in="smoothHeight" surfaceScale="18" diffuseConstant=".72" lighting-color="#f3f0df" result="light">
      <feDistantLight azimuth="315" elevation="48"/>
    </feDiffuseLighting>
    <feBlend in="SourceGraphic" in2="light" mode="multiply"/>
  </filter>`;
}

export function renderWorldAtlasSvg(atlas: WorldAtlasDocument): string {
  const oceanSeed = (hash32(`${atlas.seed}:ocean`) % 9000) + 1;
  const land = atlas.landmasses
    .map((landmass, index) => renderLandmass(atlas, landmass, index))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${atlas.widthMiles} ${atlas.heightMiles}" role="img" aria-label="${escapeXml(atlas.title)} orthographic satellite map">
  <defs>
    <linearGradient id="ocean" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#0d4160"/>
      <stop offset=".45" stop-color="#0a3552"/>
      <stop offset="1" stop-color="#072a43"/>
    </linearGradient>
    <radialGradient id="oceanDepth" cx="48%" cy="40%" r="78%">
      <stop offset="0" stop-color="#256e7e" stop-opacity=".19"/>
      <stop offset=".58" stop-color="#0d4962" stop-opacity=".08"/>
      <stop offset="1" stop-color="#061e35" stop-opacity=".34"/>
    </radialGradient>
    <filter id="oceanVariation" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".00032 .00072" numOctaves="2" seed="${oceanSeed}" result="waterRaw"/>
      <feColorMatrix in="waterRaw" type="saturate" values="0" result="waterGray"/>
      <feGaussianBlur in="waterGray" stdDeviation="16"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope=".16" intercept=".1"/>
        <feFuncG type="linear" slope=".22" intercept=".16"/>
        <feFuncB type="linear" slope=".3" intercept=".24"/>
        <feFuncA type="table" tableValues="0 .12"/>
      </feComponentTransfer>
    </filter>
    <filter id="biomeBlend" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="155"/>
    </filter>
    <filter id="urbanBlend" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.5"/>
    </filter>
    <filter id="ridgeBlur" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#ocean)"/>
  <rect width="100%" height="100%" fill="url(#oceanDepth)"/>
  <rect width="100%" height="100%" filter="url(#oceanVariation)" opacity=".26"/>
  ${land}
</svg>`;
}
