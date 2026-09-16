import type {
  AtlasPath,
  AtlasPlace,
  AtlasPoint,
  WorldAtlasDocument,
} from "../domain/atlas";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function points(points: readonly AtlasPoint[]): string {
  return points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}

function placeGlyph(place: AtlasPlace): string {
  switch (place.kind) {
    case "capital":
      return "★";
    case "city":
      return "◆";
    case "town":
      return "●";
    case "village":
    case "hamlet":
      return "•";
    case "port":
      return "⚓";
    case "fort":
      return "♜";
    case "castle":
      return "♛";
    case "dungeon":
      return "⚔";
    case "ruin":
      return "△";
    case "temple":
      return "✦";
    case "tower":
      return "♟";
    case "mine":
      return "◇";
    case "cave":
      return "◒";
    case "landmark":
      return "✧";
    case "planar-gate":
      return "◉";
  }
}

function pathStyle(path: AtlasPath): string {
  switch (path.kind) {
    case "road":
      return 'stroke="#6e4e2f" stroke-width="9" stroke-dasharray="22 12" opacity="0.62"';
    case "trail":
      return 'stroke="#765d43" stroke-width="5" stroke-dasharray="10 14" opacity="0.48"';
    case "sea-route":
      return 'stroke="#365f75" stroke-width="5" stroke-dasharray="18 18" opacity="0.56"';
  }
}

function niceScale(widthMiles: number): number {
  const target = widthMiles / 8;
  const values = [25, 50, 100, 250, 500, 1000, 2000, 2500, 5000];
  return values.reduce((best, value) =>
    Math.abs(value - target) < Math.abs(best - target) ? value : best,
  );
}

function renderCompass(atlas: WorldAtlasDocument): string {
  const x = atlas.widthMiles * 0.08;
  const y = atlas.heightMiles * 0.15;
  const radius = Math.min(atlas.widthMiles, atlas.heightMiles) * 0.055;
  return `<g transform="translate(${x} ${y})" filter="url(#inkShadow)">
    <circle r="${radius}" fill="rgba(246,233,194,.74)" stroke="#4a3426" stroke-width="10"/>
    <circle r="${radius * 0.72}" fill="none" stroke="#8b6845" stroke-width="4"/>
    <path d="M0 ${-radius * 1.05} L${radius * 0.15} 0 L0 ${radius * 1.05} L${-radius * 0.15} 0 Z" fill="#362519"/>
    <path d="M${-radius * 1.05} 0 L0 ${radius * 0.15} L${radius * 1.05} 0 L0 ${-radius * 0.15} Z" fill="#9b6b35"/>
    <circle r="${radius * 0.13}" fill="#d4b66c" stroke="#3b291b" stroke-width="4"/>
    <text x="0" y="${-radius * 1.18}" text-anchor="middle" class="compass">N</text>
    <text x="0" y="${radius * 1.38}" text-anchor="middle" class="compass">S</text>
    <text x="${radius * 1.25}" y="${radius * 0.1}" text-anchor="middle" class="compass">E</text>
    <text x="${-radius * 1.25}" y="${radius * 0.1}" text-anchor="middle" class="compass">W</text>
  </g>`;
}

function renderLegend(atlas: WorldAtlasDocument): string {
  const x = atlas.widthMiles * 0.805;
  const y = atlas.heightMiles * 0.67;
  const width = atlas.widthMiles * 0.17;
  const row = atlas.heightMiles * 0.026;
  const height = Math.max(atlas.heightMiles * 0.16, row * (atlas.legend.length + 2));
  const entries = atlas.legend
    .map((entry, index) => {
      const yy = y + row * (index + 1.65);
      const glyph = ["road", "trail", "sea-route"].includes(entry.kind)
        ? "━━"
        : placeGlyph({ kind: entry.kind } as AtlasPlace);
      return `<text x="${x + width * 0.08}" y="${yy}" class="legend-glyph">${escapeXml(glyph)}</text>
        <text x="${x + width * 0.24}" y="${yy}" class="legend-text">${escapeXml(entry.label)}</text>`;
    })
    .join("\n");
  return `<g filter="url(#inkShadow)">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="24" fill="rgba(244,231,195,.9)" stroke="#65492f" stroke-width="8"/>
    <text x="${x + width / 2}" y="${y + row * 0.82}" text-anchor="middle" class="legend-title">LEGEND</text>
    ${entries}
  </g>`;
}

function renderScale(atlas: WorldAtlasDocument): string {
  const scaleMiles = niceScale(atlas.widthMiles);
  const visualWidth = scaleMiles;
  const x = atlas.widthMiles * 0.055;
  const y = atlas.heightMiles * 0.92;
  return `<g filter="url(#inkShadow)">
    <line x1="${x}" y1="${y}" x2="${x + visualWidth}" y2="${y}" stroke="#2f2118" stroke-width="14"/>
    <line x1="${x}" y1="${y - 42}" x2="${x}" y2="${y + 42}" stroke="#2f2118" stroke-width="10"/>
    <line x1="${x + visualWidth}" y1="${y - 42}" x2="${x + visualWidth}" y2="${y + 42}" stroke="#2f2118" stroke-width="10"/>
    <text x="${x + visualWidth / 2}" y="${y - 70}" text-anchor="middle" class="scale">${scaleMiles.toLocaleString()} miles</text>
  </g>`;
}

export function renderWorldAtlasSvg(atlas: WorldAtlasDocument): string {
  const land = atlas.landmasses
    .map((landmass, index) => {
      const fills = ["url(#landA)", "url(#landB)", "url(#landC)", "url(#landD)"];
      return `<polygon points="${points(landmass.points)}" fill="${fills[index % fills.length]}" stroke="#66523b" stroke-width="14" stroke-linejoin="round"/>`;
    })
    .join("\n");

  const roads = atlas.paths
    .map(
      (path) =>
        `<polyline points="${points(path.points)}" fill="none" ${pathStyle(path)} stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join("\n");

  const rivers = atlas.rivers
    .map(
      (river) =>
        `<polyline points="${points(river.points)}" fill="none" stroke="#4f88a0" stroke-width="16" opacity=".8" stroke-linecap="round"/>`,
    )
    .join("\n");

  const mountains = atlas.mountainRanges
    .flatMap((range) =>
      range.points.map(
        (point, index) => `<g transform="translate(${point.x} ${point.y})">
          <path d="M-56 48 L0 -62 L56 48 Z" fill="#837666" stroke="#4d4339" stroke-width="8"/>
          <path d="M-18 -26 L0 -62 L20 -24 L8 -32 L0 -18 L-7 -31 Z" fill="#e9e4d9" opacity=".92"/>
          ${index === Math.floor(range.points.length / 2) ? `<text y="-82" text-anchor="middle" class="terrain-label">${escapeXml(range.name)}</text>` : ""}
        </g>`,
      ),
    )
    .join("\n");

  const regionLabels = atlas.regions
    .filter((region) => region.importance > 0.7)
    .map(
      (region) =>
        `<text x="${region.center.x}" y="${region.center.y}" text-anchor="middle" class="region-label">${escapeXml(region.name)}</text>`,
    )
    .join("\n");

  const placeMarks = atlas.places
    .filter((place) => place.importance > 0.38)
    .map((place) => {
      const fontSize = 42 + place.importance * 38;
      const labelSize = 28 + place.importance * 22;
      return `<g transform="translate(${place.x} ${place.y})">
        <text text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" class="place-glyph">${escapeXml(placeGlyph(place))}</text>
        ${place.importance > 0.52 ? `<text y="${fontSize * 0.92}" text-anchor="middle" font-size="${labelSize}" class="place-label">${escapeXml(place.name)}</text>` : ""}
      </g>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${atlas.widthMiles} ${atlas.heightMiles}" role="img" aria-label="${escapeXml(atlas.title)} fantasy world atlas">
  <defs>
    <linearGradient id="ocean" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#8fb6bd"/>
      <stop offset=".55" stop-color="#6f9fa9"/>
      <stop offset="1" stop-color="#527f8c"/>
    </linearGradient>
    <radialGradient id="landA"><stop offset="0" stop-color="#9dad72"/><stop offset="1" stop-color="#70875a"/></radialGradient>
    <radialGradient id="landB"><stop offset="0" stop-color="#c3ae75"/><stop offset="1" stop-color="#92744f"/></radialGradient>
    <radialGradient id="landC"><stop offset="0" stop-color="#86a98d"/><stop offset="1" stop-color="#5e816e"/></radialGradient>
    <radialGradient id="landD"><stop offset="0" stop-color="#b8a271"/><stop offset="1" stop-color="#7f8763"/></radialGradient>
    <filter id="paper"><feTurbulence baseFrequency=".018" numOctaves="4" seed="7"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .13"/></feComponentTransfer></filter>
    <filter id="inkShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="9" dy="12" stdDeviation="10" flood-color="#1d1610" flood-opacity=".34"/></filter>
    <style>
      .place-label{font-family:Georgia,serif;font-weight:700;paint-order:stroke;stroke:#ead9ad;stroke-width:10px;fill:#34271d;letter-spacing:.02em}
      .place-glyph{font-family:Georgia,serif;paint-order:stroke;stroke:#ead9ad;stroke-width:8px;fill:#432d22}
      .region-label{font-family:Georgia,serif;font-size:68px;font-style:italic;font-weight:700;fill:#6b2824;opacity:.83;paint-order:stroke;stroke:#d9c99f;stroke-width:12px;letter-spacing:.08em}
      .terrain-label{font-family:Georgia,serif;font-size:42px;font-style:italic;fill:#443a34;paint-order:stroke;stroke:#d9c99f;stroke-width:8px}
      .legend-title,.compass,.scale{font-family:Georgia,serif;font-size:44px;font-weight:700;fill:#39281b}
      .legend-text{font-family:Georgia,serif;font-size:31px;fill:#39281b}
      .legend-glyph{font-family:Georgia,serif;font-size:34px;fill:#39281b}
    </style>
  </defs>
  <rect width="100%" height="100%" fill="url(#ocean)"/>
  <rect width="100%" height="100%" filter="url(#paper)" opacity=".7"/>
  ${land}
  ${roads}
  ${rivers}
  ${mountains}
  ${regionLabels}
  ${placeMarks}
  <text x="${atlas.widthMiles / 2}" y="${atlas.heightMiles * 0.065}" text-anchor="middle" style="font-family:Georgia,serif;font-size:110px;font-weight:700;letter-spacing:.08em;fill:#3c2a20;paint-order:stroke;stroke:#d7c99e;stroke-width:18px">${escapeXml(atlas.title)}</text>
  ${renderCompass(atlas)}
  ${renderScale(atlas)}
  ${renderLegend(atlas)}
</svg>`;
}
