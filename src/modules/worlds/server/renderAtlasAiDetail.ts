/// <reference types="@cloudflare/workers-types" />

import type {
  AtlasBiome,
  AtlasPoint,
  WorldAtlasDocument,
} from "../domain/atlas";
import {
  DEFAULT_ATLAS_IMAGE_MODEL,
  type AiSatelliteRender,
} from "./renderAtlasAiSatellite";

export const WORLD_ATLAS_DETAIL_RENDERER_VERSION = "ai-satellite-detail-v1";

const CONTROL_SIZE = 512;
type Rgb = readonly [number, number, number];

const BIOME_RGB: Record<AtlasBiome, Rgb> = {
  temperate: [99, 129, 72],
  forest: [31, 75, 42],
  tundra: [176, 190, 184],
  desert: [197, 169, 108],
  steppe: [146, 142, 83],
  swamp: [59, 91, 66],
  jungle: [24, 86, 43],
  highlands: [119, 108, 89],
  badlands: [151, 91, 64],
  enchanted: [55, 112, 82],
};

export interface AtlasDetailViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pointInPolygon(point: AtlasPoint, polygon: readonly AtlasPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const left = polygon[i]!;
    const right = polygon[j]!;
    const intersects =
      left.y > point.y !== right.y > point.y &&
      point.x < ((right.x - left.x) * (point.y - left.y)) / (right.y - left.y || 1e-9) + left.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function setPixel(buffer: Uint8Array, x: number, y: number, rgb: Rgb): void {
  if (x < 0 || y < 0 || x >= CONTROL_SIZE || y >= CONTROL_SIZE) return;
  const offset = (Math.floor(y) * CONTROL_SIZE + Math.floor(x)) * 3;
  buffer[offset] = rgb[0];
  buffer[offset + 1] = rgb[1];
  buffer[offset + 2] = rgb[2];
}

function worldToPixel(point: AtlasPoint, view: AtlasDetailViewport): AtlasPoint {
  return {
    x: ((point.x - view.x) / Math.max(1, view.width)) * (CONTROL_SIZE - 1),
    y: ((point.y - view.y) / Math.max(1, view.height)) * (CONTROL_SIZE - 1),
  };
}

function drawDisc(buffer: Uint8Array, center: AtlasPoint, radius: number, color: Rgb): void {
  const minX = Math.floor(center.x - radius);
  const maxX = Math.ceil(center.x + radius);
  const minY = Math.floor(center.y - radius);
  const maxY = Math.ceil(center.y + radius);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (Math.hypot(x - center.x, y - center.y) <= radius) setPixel(buffer, x, y, color);
    }
  }
}

function drawLine(buffer: Uint8Array, from: AtlasPoint, to: AtlasPoint, color: Rgb, width: number): void {
  const distance = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
  const steps = Math.ceil(distance * 1.5);
  for (let index = 0; index <= steps; index += 1) {
    const ratio = index / steps;
    drawDisc(
      buffer,
      { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio },
      width,
      color,
    );
  }
}

function drawPolyline(
  buffer: Uint8Array,
  points: readonly AtlasPoint[],
  view: AtlasDetailViewport,
  color: Rgb,
  width: number,
): void {
  for (let index = 1; index < points.length; index += 1) {
    drawLine(
      buffer,
      worldToPixel(points[index - 1]!, view),
      worldToPixel(points[index]!, view),
      color,
      width,
    );
  }
}

function buildDetailControlRaster(atlas: WorldAtlasDocument, view: AtlasDetailViewport): Uint8Array {
  const buffer = new Uint8Array(CONTROL_SIZE * CONTROL_SIZE * 3);
  const deepOcean: Rgb = [17, 55, 77];
  for (let y = 0; y < CONTROL_SIZE; y += 1) {
    for (let x = 0; x < CONTROL_SIZE; x += 1) {
      setPixel(buffer, x, y, deepOcean);
    }
  }

  for (let py = 0; py < CONTROL_SIZE; py += 1) {
    const worldY = view.y + (py / (CONTROL_SIZE - 1)) * view.height;
    for (let px = 0; px < CONTROL_SIZE; px += 1) {
      const worldX = view.x + (px / (CONTROL_SIZE - 1)) * view.width;
      const point = { x: worldX, y: worldY };
      const landmass = atlas.landmasses.find((candidate) => pointInPolygon(point, candidate.points));
      if (!landmass) continue;
      let color = BIOME_RGB[landmass.biome];
      const region = atlas.regions
        .filter((candidate) => candidate.landmassId === landmass.id)
        .sort(
          (left, right) =>
            Math.hypot(point.x - left.center.x, point.y - left.center.y) -
            Math.hypot(point.x - right.center.x, point.y - right.center.y),
        )[0];
      if (region) {
        const regionColor = BIOME_RGB[region.biome];
        color = [
          Math.round((color[0] + regionColor[0] * 2) / 3),
          Math.round((color[1] + regionColor[1] * 2) / 3),
          Math.round((color[2] + regionColor[2] * 2) / 3),
        ];
      }
      setPixel(buffer, px, py, color);
    }
  }

  for (const range of atlas.mountainRanges) {
    drawPolyline(buffer, range.points, view, [105, 98, 88], 3.5);
  }
  for (const river of atlas.rivers) {
    drawPolyline(buffer, river.points, view, [54, 126, 168], 1.8);
  }
  for (const path of atlas.paths) {
    const color: Rgb = path.kind === "sea-route" ? [68, 135, 168] : path.kind === "trail" ? [135, 117, 85] : [166, 147, 104];
    drawPolyline(buffer, path.points, view, color, path.kind === "road" ? 1.35 : 0.9);
  }
  for (const place of atlas.places) {
    if (
      place.x < view.x ||
      place.x > view.x + view.width ||
      place.y < view.y ||
      place.y > view.y + view.height
    ) continue;
    const radius = place.kind === "capital" ? 5 : place.kind === "city" ? 4 : place.kind === "town" ? 3 : 2;
    drawDisc(buffer, worldToPixel(place, view), radius, [191, 182, 155]);
  }
  return buffer;
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
    scanlines.set(rgb.subarray(y * CONTROL_SIZE * 3, (y + 1) * CONTROL_SIZE * 3), target + 1);
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
  const buffer = new ArrayBuffer(png.byteLength);
  new Uint8Array(buffer).set(png);
  return new Blob([buffer], { type: "image/png" });
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
  return { contentType: "image/webp", extension: "webp" };
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function detailPrompt(atlas: WorldAtlasDocument, view: AtlasDetailViewport, level: number): string {
  const visiblePlaces = atlas.places
    .filter(
      (place) =>
        place.x >= view.x &&
        place.x <= view.x + view.width &&
        place.y >= view.y &&
        place.y <= view.y + view.height,
    )
    .slice(0, 24)
    .map((place) => ({ name: place.name, kind: place.kind, description: place.description, tags: place.tags }));
  return [
    `Create a level-${level} high-detail straight-down satellite close-up of a persistent D&D 3.5 fantasy world.`,
    "Image 0 is authoritative control geometry for this exact viewport. Preserve coastlines, rivers, mountain corridors, settlement centers, roads, trails, and water/land boundaries.",
    "This is a FANTASY WORLD rendered with photorealistic orbital/aerial imagery. Show believable medieval-fantasy land use, forests, cropland, old roads, stone-built settlements, castles, ruins, temples, mines, magical scars or enchanted terrain only where the supplied world implies them. Do not make it look modern, suburban, industrial, or science-fictional.",
    "Add natural micro-detail appropriate to the zoom: individual forest clearings, field boundaries, riverbanks, ridgelines, rocky outcrops, settlement street texture, docks, walls, farms, and trail corridors. Never add text, labels, icons, UI, borders, compass graphics, or dashed route lines.",
    `World: ${atlas.title}. Viewport miles: x=${Math.round(view.x)}, y=${Math.round(view.y)}, width=${Math.round(view.width)}, height=${Math.round(view.height)}. Nearby fantasy places: ${JSON.stringify(visiblePlaces)}.`,
  ].join("\n");
}

interface WorkersImageAi {
  run(
    model: string,
    input: { multipart: { body: ReadableStream<Uint8Array> | null; contentType: string } },
  ): Promise<{ image?: string }>;
}

export async function renderWorldAtlasDetailWithAI(
  ai: Ai,
  atlas: WorldAtlasDocument,
  view: AtlasDetailViewport,
  level: number,
  configuredModel?: string,
): Promise<AiSatelliteRender> {
  const model = configuredModel?.trim() || DEFAULT_ATLAS_IMAGE_MODEL;
  const normalizedView = {
    x: clamp(view.x, 0, atlas.widthMiles),
    y: clamp(view.y, 0, atlas.heightMiles),
    width: clamp(view.width, atlas.widthMiles / 24, atlas.widthMiles),
    height: clamp(view.height, atlas.heightMiles / 24, atlas.heightMiles),
  };
  normalizedView.x = clamp(normalizedView.x, 0, atlas.widthMiles - normalizedView.width);
  normalizedView.y = clamp(normalizedView.y, 0, atlas.heightMiles - normalizedView.height);

  const controlPng = await encodeControlPng(buildDetailControlRaster(atlas, normalizedView));
  const aspect = normalizedView.width / Math.max(1, normalizedView.height);
  const maximum = 1536;
  const minimum = 896;
  const width = aspect >= 1 ? maximum : Math.round(clamp(maximum * aspect, minimum, maximum));
  const height = aspect >= 1 ? Math.round(clamp(maximum / aspect, minimum, maximum)) : maximum;
  const form = new FormData();
  form.append("input_image_0", controlPng, "atlas-detail-control.png");
  form.append("prompt", detailPrompt(atlas, normalizedView, level));
  form.append("width", String(width));
  form.append("height", String(height));
  form.append("steps", level >= 3 ? "24" : "20");
  form.append("guidance", "4.2");
  form.append(
    "seed",
    String(hash32(`${atlas.seed}:detail:${level}:${Math.round(normalizedView.x)}:${Math.round(normalizedView.y)}`) % 2_147_483_647),
  );

  const request = new Response(form);
  const contentType = request.headers.get("content-type");
  if (!request.body || !contentType) throw new Error("Unable to serialize the AI detail render request.");
  const response = await (ai as unknown as WorkersImageAi).run(model, {
    multipart: { body: request.body, contentType },
  });
  if (!response?.image) throw new Error(`Workers AI model ${model} did not return a detail image.`);
  const bytes = decodeBase64(response.image);
  if (bytes.length < 1_024) throw new Error(`Workers AI model ${model} returned an invalid detail image.`);
  return {
    bytes,
    ...detectImage(bytes),
    model,
    width,
    height,
  };
}
