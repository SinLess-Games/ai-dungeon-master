/**
 * Post-generation clean-up for worlds.
 *
 * Older saved worlds (and the occasional unlucky roll) produced silly doubled
 * names like "Wellwell", and roads that ran straight across open water. This
 * module fixes both, and promotes coastal settlements to ports so sea lanes
 * have somewhere to land.
 */

import type { SiteKind, World, WorldRegion, WorldRoute, WorldSite } from "./world";

const ALT_TAILS = [
  "hollow", "barrow", "ford", "crest", "haven", "watch", "reach", "gate",
  "mere", "stead", "cairn", "row", "bridge", "moor",
];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;

/** "Wellwell" -> "Wellbarrow"; also splits exact duplicate site names. */
function tidyName(name: string, taken: Set<string>): string {
  let out = name.trim();
  const doubled = /^([A-Z][a-z]+)([a-z]+)$/.exec(out);
  if (doubled) {
    const head = doubled[1]!.toLowerCase();
    const tail = doubled[2]!.toLowerCase();
    if (head === tail || head.endsWith(tail) || tail.startsWith(head)) {
      const alt = ALT_TAILS.find((t) => t !== tail && !taken.has(`${doubled[1]}${t}`.toLowerCase()));
      out = `${doubled[1]}${alt ?? "haven"}`;
    }
  }
  let candidate = out;
  let n = 2;
  while (taken.has(candidate.toLowerCase())) candidate = `${out} ${["", "", "the Lesser", "the Greater", "Cross"][n++ % 5] || n}`;
  taken.add(candidate.toLowerCase());
  return candidate;
}

/** Land is the union of the region rects (the drawn coastline hugs them). */
function onLand(regions: WorldRegion[], x: number, y: number, pad = 1) {
  return regions.some((r) => x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad);
}

function crossesWater(regions: WorldRegion[], a: WorldSite, b: WorldSite) {
  const steps = 20;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (!onLand(regions, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return true;
  }
  return false;
}

const SETTLEMENT: SiteKind[] = ["city", "town", "village", "port", "keep"];

/** How close a site sits to open water (0 = right on the shore). */
function shoreDistance(regions: WorldRegion[], s: WorldSite) {
  for (let d = 1; d <= 14; d++) {
    for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, d], [d, -d], [-d, -d]] as const) {
      if (!onLand(regions, s.x + dx, s.y + dy, 0)) return d;
    }
  }
  return 99;
}

export function repairWorld(world: World): { world: World; changed: boolean } {
  const w: World = structuredClone(world);
  let changed = false;

  /* ---------------------------------------------------------- site names */
  const taken = new Set<string>();
  for (const s of w.sites) {
    const tidy = tidyName(s.name, taken);
    if (tidy !== s.name) {
      s.name = tidy;
      changed = true;
    }
  }
  const regionNames = new Set<string>();
  for (const r of w.regions) {
    const tidy = tidyName(r.name, regionNames);
    if (tidy !== r.name) {
      r.name = tidy;
      changed = true;
    }
  }

  /* -------------------------------------------------------------- ports */
  const coastal = w.sites
    .filter((s) => SETTLEMENT.includes(s.kind))
    .map((s) => ({ s, d: shoreDistance(w.regions, s) }))
    .filter((e) => e.d <= 6)
    .sort((a, b) => a.d - b.d);

  let ports = w.sites.filter((s) => s.kind === "port");
  for (const { s } of coastal) {
    if (ports.length >= 2) break;
    if (s.kind === "port") continue;
    s.kind = "port";
    ports.push(s);
    changed = true;
  }
  // a shoreline city keeps its own harbour: nothing else to change there.

  /* ------------------------------------------------------------- routes */
  const byId = new Map(w.sites.map((s) => [s.id, s]));
  const kept: WorldRoute[] = [];
  for (const route of w.routes) {
    const a = byId.get(route.fromSiteId);
    const b = byId.get(route.toSiteId);
    if (!a || !b) {
      changed = true;
      continue;
    }
    const wet = crossesWater(w.regions, a, b);
    if (!wet) {
      if (route.kind === "sea") {
        kept.push({ ...route, kind: "road" });
        changed = true;
      } else kept.push(route);
      continue;
    }
    // A land route that would swim: make it a sea lane between two harbours.
    const canSail = SETTLEMENT.includes(a.kind) && SETTLEMENT.includes(b.kind);
    if (!canSail) {
      changed = true;
      continue; // drop roads to inland ruins across the water
    }
    for (const s of [a, b]) {
      if (s.kind !== "port" && s.kind !== "city") {
        s.kind = "port";
        changed = true;
      }
    }
    if (route.kind !== "sea") changed = true;
    kept.push({ ...route, kind: "sea" });
  }

  // Make sure every port pair on opposite shores has at least one lane.
  ports = w.sites.filter((s) => s.kind === "port");
  if (ports.length >= 2 && !kept.some((r) => r.kind === "sea")) {
    const [p, q] = [ports[0]!, ports[1]!];
    if (crossesWater(w.regions, p, q)) {
      kept.push({ id: uid(), fromSiteId: p.id, toSiteId: q.id, kind: "sea" });
      changed = true;
    }
  }

  w.routes = kept;

  const marker = w.sites.find((s) => s.id === w.party.siteId);
  if (marker) w.party = { x: marker.x, y: marker.y, siteId: marker.id };

  return { world: w, changed };
}
