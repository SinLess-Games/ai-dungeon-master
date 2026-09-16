/// <reference types="@cloudflare/workers-types" />

import type {
  AtlasBiome,
  AtlasPlace,
  AtlasPoint,
  WorldAtlasDocument,
} from "../domain/atlas";

export const WORLD_ATLAS_RENDERER_VERSION = "ai-satellite-v2-fast-progressive";
export const DEFAULT_ATLAS_IMAGE_MODEL = "@cf/black-forest-labs/flux-2-dev";

const CONTROL_SIZE = 512;

type Rgb = readonly [number, number, number];

const BIOME_RGB: Record<AtlasBiome, Rgb> = {
  temperate: [103, 132, 74],
  forest: [37, 82, 48],
  tundra: [174, 187, 181],
  desert: [193, 164, 103],
  steppe: [143, 139, 82],
  swamp: [66, 96, 70],
  jungle: [27, 91, 48],
  highlands: [119, 108, 89],
  badlands: [151, 91, 64],
  enchanted: [65, 112, 82],
};

const PLACE_RADIUS: Record<AtlasPlace["kind"], number> = {
  capital: 7,
  city: 6,
  town: 5,
  village: 4,
  hamlet: 3,
  port: 5,
  fort: 4,
  castle: 4,
  dungeon: 3,
  ruin: 3,
  temple: 3,
  tower: 3,
  mine: 3,
  cave: 3,
  landmark: 3,
  "planar-gate": 4,
};

function hash32(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function scaledPoint(atlas: WorldAtlasDocument, point: AtlasPoint): AtlasPoint {
  return {
    x: clamp(Math.round((point.x / atlas.widthMiles) * (CONTROL_SIZE - 1)), 0, CONTROL_SIZE - 1),
    y: clamp(Math.round((point.y / atlas.heightMiles) * (CONTROL_SIZE - 1)), 0, CONTROL_SIZE - 1),
  };
}

function setPixel(pixels: Uint8Array, x: number, y: number, color: Rgb): void {
  if (x < 0 || y < 0 || x >= CONTROL_SIZE || y >= CONTROL_SIZE) return;
  const offset = (y * CONTROL_SIZE + x) * 3;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
}

function blendPixel(
  pixels: Uint8Array,
  x: number,
  y: number,
  color: Rgb,
  alpha: number,
): void {
  if (x < 0 || y < 0 || x >= CONTROL_SIZE || y >= CONTROL_SIZE) return;
  const offset = (y * CONTROL_SIZE + x) * 3;
  pixels[offset] = Math.round((pixels[offset] ?? 0) * (1 - alpha) + color[0] * alpha);
  pixels[offset + 1] = Math.round((pixels[offset + 1] ?? 0) * (1 - alpha) + color[1] * alpha);
  pixels[offset + 2] = Math.round((pixels[offset + 2] ?? 0) * (1 - alpha) + color[2] * alpha);
}

function fillPolygon(
  pixels: Uint8Array,
  mask: Uint8Array,
  polygon: readonly AtlasPoint[],
  color: Rgb,
): void {
  if (polygon.length < 3) return;
  const minY = clamp(Math.floor(Math.min(...polygon.map((point) => point.y))), 0, CONTROL_SIZE - 1);
  const maxY = clamp(Math.ceil(Math.max(...polygon.map((point) => point.y))), 0, CONTROL_SIZE - 1);

  for (let y = minY; y <= maxY; y += 1) {
    const scanY = y + 0.5;
    const intersections: number[] = [];
    for (let index = 0; index < polygon.length; index += 1) {
      const a = polygon[index]!;
      const b = polygon[(index + 1) % polygon.length]!;
      if ((a.y > scanY) === (b.y > scanY)) continue;
      const ratio = (scanY - a.y) / (b.y - a.y || Number.EPSILON);
      intersections.push(a.x + (b.x - a.x) * ratio);
    }
    intersections.sort((left, right) => left - right);
    for (let index = 0; index + 1 < intersections.length; index += 2) {
      const start = clamp(Math.ceil(intersections[index]!), 0, CONTROL_SIZE - 1);
      const end = clamp(Math.floor(intersections[index + 1]!), 0, CONTROL_SIZE - 1);
      for (let x = start; x <= end; x += 1) {
        setPixel(pixels, x, y, color);
        mask[y * CONTROL_SIZE + x] = 1;
      }
    }
  }
}

function drawDisc(
  pixels: Uint8Array,
  mask: Uint8Array | null,
  center: AtlasPoint,
  radius: number,
  color: Rgb,
  alpha = 1,
): void {
  const minX = Math.floor(center.x - radius);
  const maxX = Math.ceil(center.x + radius);
  const minY = Math.floor(center.y - radius);
  const maxY = Math.ceil(center.y + radius);
  const radiusSquared = radius * radius;
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if ((x - center.x) ** 2 + (y - center.y) ** 2 > radiusSquared) continue;
      if (mask && !mask[y * CONTROL_SIZE + x]) continue;
      if (alpha >= 1) setPixel(pixels, x, y, color);
      else blendPixel(pixels, x, y, color, alpha);
    }
  }
}

function drawLine(
  pixels: Uint8Array,
  points: readonly AtlasPoint[],
  color: Rgb,
  thickness: number,
): void {
  const drawSegment = (start: AtlasPoint, end: AtlasPoint) => {
    let x0 = Math.round(start.x);
    let y0 = Math.round(start.y);
    const x1 = Math.round(end.x);
    const y1 = Math.round(end.y);
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      drawDisc(pixels, null, { x: x0, y: y0 }, thickness, color);
      if (x0 === x1 && y0 === y1) break;
      const doubled = 2 * error;
      if (doubled >= dy) {
        error += dy;
        x0 += sx;
      }
      if (doubled <= dx) {
        error += dx;
        y0 += sy;
      }
    }
  };

  for (let index = 1; index < points.length; index += 1) {
    drawSegment(points[index - 1]!, points[index]!);
  }
}

function buildControlRaster(atlas: WorldAtlasDocument): Uint8Array {
  const pixels = new Uint8Array(CONTROL_SIZE * CONTROL_SIZE * 3);
  const landMask = new Uint8Array(CONTROL_SIZE * CONTROL_SIZE);
  for (let index = 0; index < pixels.length; index += 3) {
    pixels[index] = 18;
    pixels[index + 1] = 72;
    pixels[index + 2] = 103;
  }

  for (const landmass of atlas.landmasses) {
    fillPolygon(
      pixels,
      landMask,
      landmass.points.map((point) => scaledPoint(atlas, point)),
      BIOME_RGB[landmass.biome],
    );
  }

  for (const region of atlas.regions) {
    const radiusMiles = 220 + region.importance * 420;
    const radiusPixels = Math.max(
      8,
      (radiusMiles / Math.max(atlas.widthMiles, atlas.heightMiles)) * CONTROL_SIZE,
    );
    drawDisc(
      pixels,
      landMask,
      scaledPoint(atlas, region.center),
      radiusPixels,
      BIOME_RGB[region.biome],
      0.58,
    );
  }

  for (const range of atlas.mountainRanges) {
    drawLine(
      pixels,
      range.points.map((point) => scaledPoint(atlas, point)),
      [86, 78, 69],
      3,
    );
  }
  for (const river of atlas.rivers) {
    drawLine(
      pixels,
      river.points.map((point) => scaledPoint(atlas, point)),
      [46, 125, 163],
      1,
    );
  }
  for (const path of atlas.paths) {
    drawLine(
      pixels,
      path.points.map((point) => scaledPoint(atlas, point)),
      path.kind === "sea-route" ? [101, 180, 207] : path.kind === "road" ? [196, 174, 126] : [157, 145, 110],
      path.kind === "road" ? 1 : 0.6,
    );
  }
  for (const place of atlas.places) {
    const center = scaledPoint(atlas, place);
    const radius = PLACE_RADIUS[place.kind];
    const color: Rgb = place.kind === "port" ? [174, 192, 190] : [170, 166, 154];
    drawDisc(pixels, null, center, radius, color, 0.92);
  }

  return pixels;
}

function writeUint32(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const body = concatBytes([typeBytes, data]);
  return concatBytes([writeUint32(data.length), body, writeUint32(crc32(body))]);
}

async function encodeControlPng(rgb: Uint8Array): Promise<Blob> {
  const scanlines = new Uint8Array(CONTROL_SIZE * (CONTROL_SIZE * 3 + 1));
  for (let y = 0; y < CONTROL_SIZE; y += 1) {
    const target = y * (CONTROL_SIZE * 3 + 1);
    scanlines[target] = 0;
    scanlines.set(
      rgb.subarray(y * CONTROL_SIZE * 3, (y + 1) * CONTROL_SIZE * 3),
      target + 1,
    );
  }

  const compressed = new Uint8Array(
    await new Response(
      new Blob([scanlines]).stream().pipeThrough(new CompressionStream("deflate")),
    ).arrayBuffer(),
  );
  const ihdr = concatBytes([
    writeUint32(CONTROL_SIZE),
    writeUint32(CONTROL_SIZE),
    new Uint8Array([8, 2, 0, 0, 0]),
  ]);
  const png = concatBytes([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", new Uint8Array()),
  ]);
  const pngBuffer = new ArrayBuffer(png.byteLength);
  new Uint8Array(pngBuffer).set(png);
  return new Blob([pngBuffer], { type: "image/png" });
}

function outputDimensions(atlas: WorldAtlasDocument): { width: number; height: number } {
  const aspect = atlas.widthMiles / Math.max(1, atlas.heightMiles);
  const maximum = 1280;
  const minimum = 704;
  const round64 = (value: number) => Math.max(256, Math.round(value / 64) * 64);
  if (aspect >= 1) {
    return { width: maximum, height: clamp(round64(maximum / aspect), minimum, maximum) };
  }
  return { width: clamp(round64(maximum * aspect), minimum, maximum), height: maximum };
}

function satellitePrompt(atlas: WorldAtlasDocument): string {
  const biomeList = [...new Set([...atlas.landmasses, ...atlas.regions].map((entry) => entry.biome))];
  const settlementCounts = atlas.places.reduce<Record<string, number>>((counts, place) => {
    counts[place.kind] = (counts[place.kind] ?? 0) + 1;
    return counts;
  }, {});
  return [
    "Transform image 0 into a highly realistic cloud-free orbital satellite photograph of a persistent Dungeons & Dragons 3.5 FANTASY WORLD.",
    "IMAGE 0 IS THE AUTHORITATIVE AI-GENERATED GEOGRAPHIC CONTROL MAP. Preserve its continent/coastline shapes, water-vs-land boundaries, mountain corridors, rivers, settlement centers, and transport corridors as closely as possible.",
    "Camera: perfectly straight-down orthographic nadir view, high-altitude Earth-observation satellite, no perspective, no horizon, no clouds, daytime natural sunlight.",
    "Visual target: modern Google Earth / commercial satellite imagery applied to a believable medieval-fantasy world. It must be photorealistic remote-sensing imagery, not an illustrated map, not painterly, not parchment, and not a modern-world map.",
    "Render dense forests as irregular dark-green canopy, grasslands as natural muted green, farmland as believable pre-industrial patchwork around settlements, deserts as tan mineral terrain, wetlands as dark green-brown mosaics, and highlands/mountain ranges with realistic relief shadows and exposed rock.",
    "Cities and towns should appear as believable medieval-fantasy built-up footprints: dense old street fabrics, stone walls where appropriate, castles, temples, docks, farms, and roads rather than highways, suburbs, skyscrapers, airports, power grids, or modern industrial zones. Ports must visibly touch the coastline with harbor development.",
    "Fantasy elements implied by the atlas—enchanted terrain, ancient ruins, magical scars, planar sites, cursed regions, monumental keeps or temples—should be visible when plausible from altitude, but should still look physically integrated into the landscape.",
    "Roads should appear as subtle old corridors connecting inhabited areas. Rivers must remain in their supplied corridors and flow through natural valleys. Sea routes are conceptual only: DO NOT draw dashed lines or shipping-lane graphics in the satellite image.",
    "Ocean should be deep navy offshore with realistic turquoise/teal shallow coastal water and shelf variation. Coastlines should look naturally eroded while retaining the control-map geometry.",
    "Do not add labels, text, icons, borders, compass roses, legends, markers, dashed map lines, UI, frames, decorative cartography, or clouds.",
    `World title: ${atlas.title}. Campaign decisions: ${JSON.stringify(atlas.campaignDecisions)}. Dominant biomes: ${biomeList.join(", ")}. Settlement inventory: ${JSON.stringify(settlementCounts)}.`,
  ].join("\n");
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value.replace(/^data:[^,]+,/, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function detectImage(bytes: Uint8Array): { contentType: string; extension: string } {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { contentType: "image/png", extension: "png" };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }
  return { contentType: "image/jpeg", extension: "jpg" };
}

interface WorkersImageAi {
  run(
    model: string,
    input: { multipart: { body: ReadableStream<Uint8Array> | null; contentType: string } },
  ): Promise<{ image?: string }>;
}

export interface AiSatelliteRender {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
  model: string;
  width: number;
  height: number;
}

export async function renderWorldAtlasWithAI(
  ai: Ai,
  atlas: WorldAtlasDocument,
  configuredModel?: string,
): Promise<AiSatelliteRender> {
  const model = configuredModel?.trim() || DEFAULT_ATLAS_IMAGE_MODEL;
  const controlPng = await encodeControlPng(buildControlRaster(atlas));
  const dimensions = outputDimensions(atlas);
  const form = new FormData();
  form.append("input_image_0", controlPng, "atlas-control.png");
  form.append("prompt", satellitePrompt(atlas));
  form.append("width", String(dimensions.width));
  form.append("height", String(dimensions.height));
  form.append("steps", "20");
  form.append("guidance", "4.2");
  form.append("seed", String(hash32(`${atlas.seed}:satellite-image`) % 2_147_483_647));

  const request = new Response(form);
  const contentType = request.headers.get("content-type");
  if (!request.body || !contentType) throw new Error("Unable to serialize the AI satellite render request.");

  const response = await (ai as unknown as WorkersImageAi).run(model, {
    multipart: { body: request.body, contentType },
  });
  if (!response?.image) throw new Error(`Workers AI model ${model} did not return an image.`);
  const bytes = decodeBase64(response.image);
  if (bytes.length < 1_024) throw new Error(`Workers AI model ${model} returned an invalid image payload.`);
  const detected = detectImage(bytes);
  return {
    bytes,
    ...detected,
    model,
    ...dimensions,
  };
}
