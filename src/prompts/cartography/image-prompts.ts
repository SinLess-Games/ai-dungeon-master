import type { World, WorldSite } from "@/lib/world";

const STYLE = [
  "Photorealistic satellite image of a planet's surface, taken straight down from orbit,",
  "like high-resolution true-colour Earth observation imagery.",
  "Deep blue ocean with realistic turquoise shallows over reefs and continental shelves,",
  "sediment plumes at river mouths, and faint wave and current texture.",
  "Land shows real biome colouring: green forest canopy, olive grassland, tan and ochre desert",
  "with visible dune fields, grey-brown rock, snow-capped mountain ranges with sharp ridge shadows,",
  "dark wetlands, braided river systems and lakes, eroded valleys and alluvial fans.",
  "Natural terrain relief shading from low sun angle, subtle thin cloud wisps in a few places.",
  "No illustration, no parchment, no painting, no watercolour, no ink lines, no fantasy map styling.",
  "IMPORTANT: absolutely no text, no words, no letters, no labels, no legend,",
  "no compass rose, no border frame, no grid, no numbers anywhere in the image.",
  "The image must fill the entire frame edge to edge, landscape orientation.",
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
      ? `Show tiny grey-tan built-up patches, the size of towns seen from orbit, here:\n${settlements}`
      : "",
    roads > 0
      ? `Include about ${roads} faint pale threads of road between those built-up patches; roads never cross open water.`
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
