import type {
  AtlasBiome,
  AtlasLandmass,
  AtlasPoint,
  AtlasRegion,
  WorldAtlasDocument,
} from "../domain/atlas";

const BIOME_COLORS: Record<AtlasBiome, string> = {
  temperate: "#61764b",
  forest: "#244a31",
  tundra: "#aeb9b3",
  desert: "#b9965a",
  steppe: "#8d8952",
  swamp: "#405c46",
  jungle: "#1f5230",
  highlands: "#756c5a",
  badlands: "#995d43",
  enchanted: "#436b54",
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
  const rx = 390 + region.importance * 520;
  const ry = 260 + region.importance * 400;
  const rotation = hash32(`${region.id}:rotation`) % 180;
  const opacity = region.biome === "forest" || region.biome === "jungle" ? 0.64 : 0.48;
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
        <polyline points="${points(range.points)}" fill="none" stroke="#272923" stroke-width="72" opacity=".24" stroke-linecap="round" stroke-linejoin="round" filter="url(#ridgeBlur)"/>
        <polyline points="${points(range.points)}" fill="none" stroke="#4a4a40" stroke-width="40" opacity=".72" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${points(range.points)}" fill="none" stroke="#a7a293" stroke-width="13" opacity=".42" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`,
    )
    .join("\n");

  const rivers = atlas.rivers
    .filter((river) => river.landmassId === landmass.id)
    .map(
      (river) => `<g>
        <polyline points="${points(river.points)}" fill="none" stroke="#183b47" stroke-width="16" opacity=".66" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="${points(river.points)}" fill="none" stroke="#4f8fa5" stroke-width="8" opacity=".95" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`,
    )
    .join("\n");

  return `<g>
    <clipPath id="${clipId}"><polygon points="${points(landmass.points)}"/></clipPath>

    <!-- continental shelf / shallow water -->
    <polygon points="${points(landmass.points)}" fill="none" stroke="#82aaa3" stroke-width="130" opacity=".18" stroke-linejoin="round"/>
    <polygon points="${points(landmass.points)}" fill="none" stroke="#a5c0ae" stroke-width="58" opacity=".18" stroke-linejoin="round"/>

    <polygon points="${points(landmass.points)}" fill="${base}" stroke="#26342d" stroke-width="7" stroke-linejoin="round"/>
    <g clip-path="url(#${clipId})">
      <rect x="${(landmass.center.x - landmass.radiusX * 1.15).toFixed(1)}"
        y="${(landmass.center.y - landmass.radiusY * 1.15).toFixed(1)}"
        width="${(landmass.radiusX * 2.3).toFixed(1)}"
        height="${(landmass.radiusY * 2.3).toFixed(1)}"
        fill="${shadeHex(base, 8)}" filter="url(#terrain-${index})" opacity=".78"/>
      ${regions}
      <rect x="${(landmass.center.x - landmass.radiusX * 1.15).toFixed(1)}"
        y="${(landmass.center.y - landmass.radiusY * 1.15).toFixed(1)}"
        width="${(landmass.radiusX * 2.3).toFixed(1)}"
        height="${(landmass.radiusY * 2.3).toFixed(1)}"
        filter="url(#surfaceGrain)" opacity=".28"/>
      ${mountainRanges}
      ${rivers}
    </g>
  </g>
  <filter id="terrain-${index}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".0028 .0042" numOctaves="5" seed="${seed}" result="height"/>
    <feDiffuseLighting in="height" surfaceScale="38" diffuseConstant="1.1" lighting-color="#ffffff" result="light">
      <feDistantLight azimuth="315" elevation="42"/>
    </feDiffuseLighting>
    <feBlend in="SourceGraphic" in2="light" mode="multiply" result="shaded"/>
    <feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="3" seed="${seed + 29}" result="detail"/>
    <feBlend in="shaded" in2="detail" mode="soft-light"/>
  </filter>`;
}

export function renderWorldAtlasSvg(atlas: WorldAtlasDocument): string {
  const oceanSeed = (hash32(`${atlas.seed}:ocean`) % 9000) + 1;
  const land = atlas.landmasses.map((landmass, index) => renderLandmass(atlas, landmass, index)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${atlas.widthMiles} ${atlas.heightMiles}" role="img" aria-label="${escapeXml(atlas.title)} satellite terrain map">
  <defs>
    <linearGradient id="ocean" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#356c78"/>
      <stop offset=".42" stop-color="#275866"/>
      <stop offset="1" stop-color="#173c4c"/>
    </linearGradient>
    <radialGradient id="oceanDepth" cx="48%" cy="40%" r="78%">
      <stop offset="0" stop-color="#5b9095" stop-opacity=".24"/>
      <stop offset=".55" stop-color="#254f60" stop-opacity=".12"/>
      <stop offset="1" stop-color="#0e2c3b" stop-opacity=".42"/>
    </radialGradient>
    <filter id="oceanNoise" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".003 .008" numOctaves="4" seed="${oceanSeed}" result="noise"/>
      <feColorMatrix in="noise" type="matrix" values="
        .22 0 0 0 .03
        0 .34 0 0 .05
        0 0 .42 0 .08
        0 0 0 .34 0"/>
    </filter>
    <filter id="surfaceGrain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="4" seed="41"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 .34"/></feComponentTransfer>
    </filter>
    <filter id="biomeBlend" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur stdDeviation="115"/>
    </filter>
    <filter id="ridgeBlur" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="16"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#ocean)"/>
  <rect width="100%" height="100%" fill="url(#oceanDepth)"/>
  <rect width="100%" height="100%" filter="url(#oceanNoise)" opacity=".62"/>
  ${land}
</svg>`;
}
