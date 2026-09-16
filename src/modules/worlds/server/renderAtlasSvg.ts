import type {
  AtlasBiome,
  AtlasLandmass,
  AtlasPoint,
  AtlasRegion,
  WorldAtlasDocument,
} from "../domain/atlas";

export const WORLD_ATLAS_RENDERER_VERSION = "satellite-v2-natural-terrain";

const BIOME_COLORS: Record<AtlasBiome, string> = {
  temperate: "#667b4e",
  forest: "#284d31",
  tundra: "#aab5ae",
  desert: "#b99a62",
  steppe: "#8e8958",
  swamp: "#405b46",
  jungle: "#205233",
  highlands: "#756c5b",
  badlands: "#945f48",
  enchanted: "#456956",
};

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
  const rx = 420 + region.importance * 560;
  const ry = 300 + region.importance * 430;
  const rotation = hash32(`${region.id}:rotation`) % 180;
  const opacity =
    region.biome === "forest" || region.biome === "jungle"
      ? 0.5
      : region.biome === "desert" || region.biome === "badlands"
        ? 0.42
        : 0.34;
  return `<ellipse cx="${region.center.x.toFixed(1)}" cy="${region.center.y.toFixed(1)}"
    rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"
    transform="rotate(${rotation} ${region.center.x.toFixed(1)} ${region.center.y.toFixed(1)})"
    fill="${color}" opacity="${opacity}" filter="url(#biomeBlend)" data-region="${index}"/>`;
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

  const mountainRanges = atlas.mountainRanges
    .filter((range) => range.landmassId === landmass.id)
    .map(
      (range) => `<g>
        <polyline points="${points(range.points)}" fill="none" stroke="#272923" stroke-width="72" opacity=".18" stroke-linecap="round" stroke-linejoin="round" filter="url(#ridgeBlur)"/>
        <polyline points="${points(range.points)}" fill="none" stroke="#4a4a40" stroke-width="38" opacity=".64" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${points(range.points)}" fill="none" stroke="#aaa696" stroke-width="10" opacity=".3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`,
    )
    .join("\n");

  const rivers = atlas.rivers
    .filter((river) => river.landmassId === landmass.id)
    .map(
      (river) => `<g>
        <polyline points="${points(river.points)}" fill="none" stroke="#183b47" stroke-width="15" opacity=".58" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${points(river.points)}" fill="none" stroke="#5b96a9" stroke-width="7" opacity=".9" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`,
    )
    .join("\n");

  const boundsX = (landmass.center.x - landmass.radiusX * 1.15).toFixed(1);
  const boundsY = (landmass.center.y - landmass.radiusY * 1.15).toFixed(1);
  const boundsWidth = (landmass.radiusX * 2.3).toFixed(1);
  const boundsHeight = (landmass.radiusY * 2.3).toFixed(1);

  return `<g>
    <clipPath id="${clipId}"><polygon points="${points(landmass.points)}"/></clipPath>

    <!-- continental shelf / shallow water -->
    <polygon points="${points(landmass.points)}" fill="none" stroke="#789b94" stroke-width="128" opacity=".14" stroke-linejoin="round"/>
    <polygon points="${points(landmass.points)}" fill="none" stroke="#a2b9aa" stroke-width="52" opacity=".13" stroke-linejoin="round"/>

    <polygon points="${points(landmass.points)}" fill="${base}" stroke="#26342d" stroke-width="6" stroke-linejoin="round"/>
    <g clip-path="url(#${clipId})">
      <!-- Broad low-frequency elevation field. This is intentionally smooth: no RGB static. -->
      <rect x="${boundsX}" y="${boundsY}" width="${boundsWidth}" height="${boundsHeight}"
        fill="${shadeHex(base, 7)}" filter="url(#terrain-${index})" opacity=".68"/>

      <!-- Large blended biome zones provide satellite-scale vegetation/climate variation. -->
      ${regions}

      <!-- Restrained monochrome ground variation. -->
      <rect x="${boundsX}" y="${boundsY}" width="${boundsWidth}" height="${boundsHeight}"
        fill="${shadeHex(base, 3)}" filter="url(#surfaceVariation-${index})" opacity=".16"/>

      ${mountainRanges}
      ${rivers}
    </g>
  </g>
  <filter id="terrain-${index}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".00065 .00105" numOctaves="3" seed="${seed}" result="heightRaw"/>
    <feColorMatrix in="heightRaw" type="saturate" values="0" result="height"/>
    <feGaussianBlur in="height" stdDeviation="18" result="smoothHeight"/>
    <feDiffuseLighting in="smoothHeight" surfaceScale="20" diffuseConstant=".78" lighting-color="#ffffff" result="light">
      <feDistantLight azimuth="315" elevation="48"/>
    </feDiffuseLighting>
    <feBlend in="SourceGraphic" in2="light" mode="multiply"/>
  </filter>
  <filter id="surfaceVariation-${index}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".0022 .0031" numOctaves="2" seed="${seed + 29}" result="variationRaw"/>
    <feColorMatrix in="variationRaw" type="saturate" values="0" result="variationGray"/>
    <feGaussianBlur in="variationGray" stdDeviation="4.5"/>
    <feComponentTransfer>
      <feFuncR type="linear" slope=".32" intercept=".34"/>
      <feFuncG type="linear" slope=".32" intercept=".34"/>
      <feFuncB type="linear" slope=".32" intercept=".34"/>
      <feFuncA type="table" tableValues="0 .22"/>
    </feComponentTransfer>
  </filter>`;
}

export function renderWorldAtlasSvg(atlas: WorldAtlasDocument): string {
  const oceanSeed = (hash32(`${atlas.seed}:ocean`) % 9000) + 1;
  const land = atlas.landmasses
    .map((landmass, index) => renderLandmass(atlas, landmass, index))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${atlas.widthMiles} ${atlas.heightMiles}" role="img" aria-label="${escapeXml(atlas.title)} satellite terrain map">
  <defs>
    <linearGradient id="ocean" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#376c77"/>
      <stop offset=".42" stop-color="#285866"/>
      <stop offset="1" stop-color="#173c4b"/>
    </linearGradient>
    <radialGradient id="oceanDepth" cx="48%" cy="40%" r="78%">
      <stop offset="0" stop-color="#65969a" stop-opacity=".18"/>
      <stop offset=".55" stop-color="#254f60" stop-opacity=".1"/>
      <stop offset="1" stop-color="#0e2c3b" stop-opacity=".38"/>
    </radialGradient>
    <filter id="oceanNoise" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".0008 .0018" numOctaves="2" seed="${oceanSeed}" result="oceanRaw"/>
      <feColorMatrix in="oceanRaw" type="saturate" values="0" result="oceanGray"/>
      <feGaussianBlur in="oceanGray" stdDeviation="7"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope=".22" intercept=".2"/>
        <feFuncG type="linear" slope=".3" intercept=".25"/>
        <feFuncB type="linear" slope=".38" intercept=".32"/>
        <feFuncA type="table" tableValues="0 .18"/>
      </feComponentTransfer>
    </filter>
    <filter id="biomeBlend" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="145"/>
    </filter>
    <filter id="ridgeBlur" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#ocean)"/>
  <rect width="100%" height="100%" fill="url(#oceanDepth)"/>
  <rect width="100%" height="100%" filter="url(#oceanNoise)" opacity=".34"/>
  ${land}
</svg>`;
}
