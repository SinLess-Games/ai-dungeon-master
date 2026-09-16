# Campaign World Atlas

Every started campaign receives its own deterministic, original planet-scale world atlas. The atlas is generated from the campaign generation seed plus creator decisions such as world template, campaign styles, structure, scale, pace, planar play, and epic play.

The atlas is a campaign-owned world, not a shared reusable setting. Starting another campaign produces another world even when the campaign options are similar.

## Player experience

Campaign play exposes the atlas as a fourth primary channel beside Campaign, OOC, and Character.

The map supports:

- pan and wheel/pinch-style zoom;
- zoom-dependent label density;
- clickable generated locations;
- generated roads, trails, and sea routes;
- continents, regions, mountain ranges, and rivers;
- an always-visible decorative compass rose;
- a physical mile scale that changes with zoom;
- a legend generated from the symbols actually present in the world;
- a parchment/watercolor high-fantasy atlas presentation.

The attached/generated geography is original. The visual direction is an illustrated fantasy atlas rather than GIS-style mapping.

## Generation contract

`src/modules/worlds/domain/atlas.ts` is the deterministic generation boundary. Given the same seed, generator version, campaign decisions, and `generatedAt`, it returns the same `WorldAtlasDocument`.

The generator creates the full world skeleton immediately:

- planet-scale dimensions measured in miles;
- multiple original landmasses;
- regions and biomes;
- mountain ranges and rivers;
- campaign-biased settlements and adventure locations;
- roads, trails, and sea routes;
- map legend metadata.

Campaign decisions bias the output. Examples include extra ports and islands for seafaring campaigns, extra ruins and wilderness sites for exploration/frontier campaigns, extra forts and castles for war/political campaigns, and planar gates for planar or epic campaigns.

Deep interiors, complete settlement populations, NPC rosters, and tactical maps remain on-demand concerns rather than being generated for every point on the planet at campaign start.

## Persistence and Cloudflare services

The atlas uses the Cloudflare services by responsibility rather than duplicating authority.

### D1 — canonical world state

D1 remains authoritative. Campaign start writes the generated atlas to the existing `world_maps` storage as a `kind = 'world'` map document. The world root still owns campaign lifecycle/generation metadata.

The atlas requires the existing offline/world-map schema from migration `0026_offline_first_cloud_sync.sql` in the deployed database. Campaign start is rollout-safe: when an older deployment does not yet have `world_maps`, campaign start keeps the world-root metadata path rather than failing the campaign.

This feature does **not** apply remote migrations automatically.

### R2 — rendered atlas assets

Background processing renders an illustrated SVG atlas and stores it under the world asset namespace in R2. Large rendered map assets belong in R2 rather than D1.

The interactive browser map still renders canonical vector/world data so labels, markers, selection, scaling, and future travel/discovery layers remain mechanically meaningful.

### KV — rebuildable atlas manifests

KV stores rebuildable atlas asset manifests and short-lived coordination/cache data. KV is never authoritative world state. If the KV entry is lost, it can be recreated from D1 and R2.

### Queues — post-generation rendering/indexing

The existing background queue accepts atlas rendering and Vectorize indexing jobs. Campaign/world persistence completes first; rendering/indexing can retry independently without changing the generated world.

### Vectorize — semantic world retrieval

Vectorize is optional at runtime until the index is provisioned. When the `WORLD_VECTOR_INDEX` binding exists, the background job indexes generated regions and locations and the campaign atlas API can perform semantic world searches.

The current deterministic atlas embedding is 64 dimensions and uses cosine similarity. Create the index with:

```bash
npx wrangler vectorize create endless-codex-worlds --dimensions=64 --metric=cosine
```

Then add the binding to `wrangler.jsonc`:

```jsonc
"vectorize": [
  {
    "binding": "WORLD_VECTOR_INDEX",
    "index_name": "endless-codex-worlds"
  }
]
```

The binding is intentionally not committed before the index exists because Wrangler/Cloudflare deployment validates bound resources and an absent index can prevent deployment.

## Server APIs

Campaign-scoped atlas reads use campaign membership authorization rather than the owner-only generic map editing routes.

- `GET /api/campaigns/:campaignId/atlas` — atlas document and current asset manifest.
- `POST /api/campaigns/:campaignId/atlas/assets` — owner/GM request to rebuild render/index assets.
- `POST /api/campaigns/:campaignId/atlas/search` — semantic search when Vectorize is bound.
- `GET /api/campaigns/:campaignId/atlas/render` — rendered atlas asset when available.

The canonical generated document remains usable even when R2, KV, or Vectorize are unavailable.

## Important boundaries

- D1 describes the world; the map visualizes it.
- R2 assets do not become gameplay authority.
- KV is cache/manifest state only.
- Vectorize is retrieval, not coordinates or canonical lore.
- Queue retries must not regenerate a different world.
- AI/world-authoring features should emit validated world mutations rather than directly rewriting arbitrary map JSON.
- Physical coordinates are measured in miles so future travel rules can use the same geometry as the displayed scale.

## Remaining work

The generated campaign atlas and player map display are implemented. The larger world-system backlog still includes:

- standalone/manual GM world-builder editing;
- region/place/path authoring tools;
- player discovery and fog of war;
- party position and travel route selection;
- D&D 3.5 travel-time, terrain, weather, and encounter integration;
- generated regional/local maps and tactical-map handoff;
- richer lore generation and AI DM retrieval using the Vectorize index.

These should extend the canonical atlas rather than create a parallel map/world model.
