/**
 * Glue between a campaign and its overland world map.
 *
 * Every campaign owns a world. When a campaign is first opened we draw a
 * starter map for it (seeded by the campaign's own styles) so the DM has real
 * geography to narrate against, and the player can open the map at any time and
 * see where they are standing.
 */

import { getWorld, newId, saveWorld } from "./storage";
import { starterWorld } from "./world-generator";
import { SITE_KINDS, TERRAIN_KINDS, regionAt, type SiteKind, type TerrainKind, type World } from "./world";
import type { Campaign, CampaignStyle } from "./campaign";

const STYLE_THEME: Partial<Record<CampaignStyle, string>> = {
  heroic: "High fantasy",
  "high-magic": "High fantasy",
  "grim-dark": "Grim-dark",
  "steampunk-magitech": "Steampunk / magi-tech",
  "high-fantasy": "High fantasy",
  steampunk: "Steampunk / magi-tech",
  "magi-tech": "Steampunk / magi-tech",
  "low-fantasy": "Sword & sorcery",
  "sword-and-sorcery": "Sword & sorcery",
  "mythic-epic": "Mythic epic",
  "gothic-horror": "Gothic horror",
  "cosmic-horror": "Gothic horror",
  "planar-adventure": "Planar",
  "nautical-pirate": "Nautical",
  "post-apocalyptic": "Post-apocalyptic",
  "fairytale-whimsy": "Fairytale",
  "science-fantasy": "Science fantasy",
  "wilderness-exploration": "Frontier",
};

export function campaignThemes(campaign: Campaign): string[] {
  const out = campaign.styles.map((s) => STYLE_THEME[s]).filter(Boolean) as string[];
  return out.length ? [...new Set(out)] : ["High fantasy"];
}

/**
 * Returns the campaign's world, drawing a fresh one the first time. Returns the
 * (possibly updated) campaign alongside it — the caller saves it.
 */
export function ensureCampaignWorld(campaign: Campaign): { campaign: Campaign; world: World } {
  const existing = campaign.worldId ? getWorld(campaign.worldId) : undefined;
  if (existing) return { campaign, world: existing };

  const id = newId();
  const name = campaign.worldName?.trim() || `${campaign.name.replace(/'s campaign$/i, "")} — the known world`;
  const world = saveWorld(starterWorld(id, name, campaignThemes(campaign)));
  const start = world.sites.find((s) => s.discovered) ?? world.sites[0];
  const next: Campaign = {
    ...campaign,
    worldId: world.id,
    worldName: world.name,
    scene: {
      ...campaign.scene,
      location: campaign.scene.location || start?.name || "A town at the edge of the map",
    },
  };
  return { campaign: next, world };
}

/* ------------------------------------------------------------------ context */

/** What the DM is told about the map before every turn. */
export function worldContext(world: World | undefined): string {
  if (!world) return "No world map has been drawn yet. Call shapeWorld to draw one before the first scene.";
  const region = regionAt(world, world.party.x, world.party.y);
  const here = world.sites.find((s) => s.id === world.party.siteId);
  const lines = [
    `World: ${world.name}${world.tagline ? ` — ${world.tagline}` : ""}`,
    world.description ? `Premise: ${world.description}` : "",
    `Scale: ${world.scaleMilesPerUnit} miles per map unit.`,
    "Regions:",
    world.regions.map((r) => `- ${r.name} (${r.terrain})${r.description ? `: ${r.description}` : ""}`).join("\n") ||
      "- none drawn",
    "Sites:",
    world.sites
      .map(
        (s) =>
          `- ${s.name} (${s.kind}, ${s.discovered ? "known to the party" : "undiscovered"}) at ${s.x},${s.y}${
            s.description ? `: ${s.description}` : ""
          }`,
      )
      .join("\n") || "- none drawn",
    `Party marker: ${here ? here.name : `open ground at ${world.party.x},${world.party.y}`}${
      region ? ` in ${region.name} (${region.terrain})` : ""
    }`,
  ];
  return lines.filter(Boolean).join("\n");
}

/* ------------------------------------------------------------------ mutation */

const TERRAINS = new Set(TERRAIN_KINDS.map((t) => t.id));
const KINDS = new Set(SITE_KINDS.map((k) => k.id));

const FALLBACK_RECTS = [
  { x: 4, y: 6, w: 30, h: 26 },
  { x: 36, y: 4, w: 28, h: 22 },
  { x: 66, y: 8, w: 28, h: 26 },
  { x: 6, y: 36, w: 32, h: 28 },
  { x: 40, y: 30, w: 26, h: 24 },
  { x: 68, y: 38, w: 26, h: 26 },
];

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

export interface ShapeWorldInput {
  worldName?: string | null;
  tagline?: string | null;
  premise?: string | null;
  regions?: { name: string; terrain?: string | null; description?: string | null }[] | null;
  sites?:
    | {
        name: string;
        kind?: string | null;
        regionName?: string | null;
        description?: string | null;
        x?: number | null;
        y?: number | null;
        discovered?: boolean | null;
      }[]
    | null;
}

/** The DM renaming and re-theming the map into their own setting. */
export function shapeWorld(world: World, input: ShapeWorldInput): { world: World; summary: string } {
  const w = structuredClone(world);
  const notes: string[] = [];

  if (input.worldName?.trim()) {
    w.name = input.worldName.trim();
    notes.push(`named ${w.name}`);
  }
  if (input.tagline?.trim()) w.tagline = input.tagline.trim();
  if (input.premise?.trim()) w.description = input.premise.trim();

  for (const [i, r] of (input.regions ?? []).entries()) {
    if (!r?.name?.trim()) continue;
    const terrain = (TERRAINS.has(norm(r.terrain) as TerrainKind) ? norm(r.terrain) : undefined) as
      | TerrainKind
      | undefined;
    const target =
      w.regions.find((x) => norm(x.name) === norm(r.name)) ?? w.regions[i] ?? undefined;
    if (target) {
      target.name = r.name.trim();
      if (terrain) target.terrain = terrain;
      if (r.description) target.description = r.description;
    } else {
      const rect = FALLBACK_RECTS[w.regions.length % FALLBACK_RECTS.length]!;
      w.regions.push({
        id: newId(),
        name: r.name.trim(),
        terrain: terrain ?? "plains",
        ...(r.description ? { description: r.description } : {}),
        ...rect,
      });
    }
  }
  if (input.regions?.length) notes.push(`${input.regions.length} regions set`);

  for (const [i, s] of (input.sites ?? []).entries()) {
    if (!s?.name?.trim()) continue;
    const kind = (KINDS.has(norm(s.kind) as SiteKind) ? norm(s.kind) : "town") as SiteKind;
    const region = s.regionName
      ? w.regions.find((r) => norm(r.name) === norm(s.regionName))
      : undefined;
    const existing =
      w.sites.find((x) => norm(x.name) === norm(s.name)) ??
      (typeof s.x !== "number" ? w.sites[i] : undefined);
    const x =
      typeof s.x === "number"
        ? Math.min(99, Math.max(1, s.x))
        : region
          ? region.x + region.w / 2
          : existing?.x ?? 10 + ((i * 17) % 80);
    const y =
      typeof s.y === "number"
        ? Math.min(69, Math.max(1, s.y))
        : region
          ? region.y + region.h / 2
          : existing?.y ?? 10 + ((i * 23) % 55);

    if (existing) {
      existing.name = s.name.trim();
      existing.kind = kind;
      existing.x = x;
      existing.y = y;
      if (region) existing.regionId = region.id;
      if (s.description) existing.description = s.description;
      if (typeof s.discovered === "boolean") existing.discovered = s.discovered;
    } else {
      w.sites.push({
        id: newId(),
        name: s.name.trim(),
        kind,
        x,
        y,
        ...(region ? { regionId: region.id } : {}),
        ...(s.description ? { description: s.description } : {}),
        discovered: s.discovered ?? false,
      });
    }
  }
  if (input.sites?.length) notes.push(`${input.sites.length} sites set`);

  // Keep the party marker attached to a real place.
  const marker = w.sites.find((s) => s.id === w.party.siteId);
  if (marker) w.party = { x: marker.x, y: marker.y, siteId: marker.id };

  return { world: saveWorld(w), summary: notes.join("; ") || "no map change" };
}

/** Move the party marker; also reveals the place they arrive at. */
export function moveParty(
  world: World,
  input: { siteName?: string | null; x?: number | null; y?: number | null },
): { world: World; summary: string } {
  const w = structuredClone(world);
  const site = input.siteName ? w.sites.find((s) => norm(s.name) === norm(input.siteName)) : undefined;
  if (site) {
    site.discovered = true;
    w.party = { x: site.x, y: site.y, siteId: site.id };
  } else if (typeof input.x === "number" && typeof input.y === "number") {
    w.party = { x: Math.min(99, Math.max(1, input.x)), y: Math.min(69, Math.max(1, input.y)) };
  } else {
    return { world, summary: "no such place on the map" };
  }
  const region = regionAt(w, w.party.x, w.party.y);
  return {
    world: saveWorld(w),
    summary: `party now at ${site ? site.name : `${w.party.x},${w.party.y}`}${region ? ` in ${region.name}` : ""}`,
  };
}

/** Reveal a site the party has learned about. */
export function discoverSite(world: World, name: string): { world: World; summary: string } {
  const w = structuredClone(world);
  const site = w.sites.find((s) => norm(s.name) === norm(name));
  if (!site) return { world, summary: "no such place on the map" };
  site.discovered = true;
  return { world: saveWorld(w), summary: `${site.name} marked on the map` };
}
