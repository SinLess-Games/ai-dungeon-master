import type { World, WorldSite } from "@/lib/world";

const STYLE = [
  "Hand-painted high-fantasy atlas illustration in the style of a classic tabletop campaign map.",
  "Aged parchment paper, muted natural pigments, soft watercolour washes, fine ink linework.",
  "Textured deep blue-green ocean with subtle wave hatching and pale shallows along every coast.",
  "Illustrated terrain: little inked mountain ridges, clustered trees for forests, dune ripples,",
  "marsh tufts, rolling hill bumps, and thin winding rivers with deltas.",
  "Painted top-down, no perspective, no photographic realism, no 3D render.",
  "IMPORTANT: absolutely no text, no words, no letters, no labels, no title, no legend,",
  "no compass rose, no border frame, no numbers anywhere in the image.",
  "The illustration must fill the entire frame edge to edge, landscape orientation.",
].join(" ");

function pct(n: number) {
  return Math.round(Math.max(0, Math.min(100, n)));
}

/** Prompt for the world atlas backdrop, matching the stored geography. */
export function worldMapPrompt(world: World) {
  const regions = world.regions
    .map(
      (r) =>
        `- ${r.terrain} landmass occupying roughly x ${pct(r.x)}-${pct(r.x + r.w)}%, y ${pct(
          r.y,
        )}-${pct(r.y + r.h)}% of the frame`,
    )
    .join("\n");

  const settlements = world.sites
    .filter((s) => ["city", "town", "village", "port", "keep"].includes(s.kind))
    .slice(0, 12)
    .map((s) => `- a small ${s.kind} marking at x ${pct(s.x)}%, y ${pct((s.y / 70) * 100)}%`)
    .join("\n");

  const roads = world.routes.filter((r) => r.kind === "road" || r.kind === "trail").length;

  return [
    STYLE,
    "",
    "Compose the geography exactly as described, measuring from the top-left of the image:",
    regions || "- one large temperate continent in the middle of the frame",
    "",
    "Surround the land with open ocean. Draw irregular, organic coastlines with bays,",
    "peninsulas, inlets and a scattering of small offshore islands.",
    settlements
      ? `Show tiny painted settlement clusters (rooftops and towers, no text) here:\n${settlements}`
      : "",
    roads > 0
      ? `Trace about ${roads} thin winding tan roads between those settlements; roads must never cross open water.`
      : "",
    world.themes.length ? `Overall mood: ${world.themes.join(", ")}.` : "",
    world.description ? `Setting flavour: ${world.description.slice(0, 400)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Prompt for a single settlement or site, painted from above. */
export function siteMapPrompt(site: WorldSite, world?: World) {
  const kind = site.kind;
  const layout: Record<string, string> = {
    city: "a large walled city: stone curtain wall with gatehouses, dense rooftops, a market square, a cathedral, a castle on high ground, docks if water is present",
    town: "a busy market town: a ring of timber and stone houses, a central square, a mill, a chapel, orchards and fields at the edge",
    village: "a small farming village: a dozen thatched cottages along a dirt lane, a well, a barn, tilled fields and hedgerows",
    port: "a harbour town: stone quays, moored sailing ships, warehouses, a lighthouse on the headland, streets climbing away from the water",
    keep: "a fortified keep: curtain walls, corner towers, a bailey, stables, a dry moat, cleared ground all around",
    dungeon: "an entrance to an underground complex: a cracked stone doorway in a hillside, rubble, and a faint path leading in",
    ruin: "a ruined settlement: broken walls, toppled columns, roofless shells reclaimed by grass and creeping trees",
    lair: "a monstrous lair: a cave mouth in a rocky outcrop, bones and scorched ground scattered nearby",
    wonder: "a strange wonder: an impossible standing structure surrounded by wild, unusual terrain",
    camp: "a temporary camp: tents in a rough ring, cook fires, a horse line, a palisade of stakes",
  };

  return [
    "Hand-painted top-down fantasy town plan on aged parchment, watercolour and ink,",
    "muted earth pigments, fine linework, the kind of local map drawn inside a fantasy atlas.",
    `Depict ${layout[kind] ?? "a small settlement of stone and timber buildings"}.`,
    "Include surrounding terrain: roads leading out of frame, trees, streams, and fields.",
    "IMPORTANT: no text, no words, no letters, no labels, no legend, no compass, no border frame.",
    "Painted straight down from above, filling the whole frame, landscape orientation.",
    site.description ? `Local flavour: ${site.description.slice(0, 300)}` : "",
    world?.themes.length ? `Overall mood: ${world.themes.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
