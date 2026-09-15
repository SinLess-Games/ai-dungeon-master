# Offline-first saves and cloud synchronization

The Endless Codex keeps D1 authoritative while allowing supported save editing to continue through temporary network loss. The browser never receives a second auth token and never becomes authoritative for combat or other live game mechanics.

## Storage layers

The browser uses IndexedDB database `endless-codex-offline` for four account-scoped stores:

- `responses`: successful JSON GET responses used for offline reads.
- `mutations`: ordered JSON writes waiting to replay.
- `versions`: last observed cloud version for a campaign, character, world, or map.
- `meta`: sync timestamps and local sync metadata.

The service worker caches the application shell and static same-origin assets. It deliberately excludes `/api/*` from Cache API storage so authenticated game data is not mixed into a shared HTTP cache. API data lives in the account-scoped IndexedDB save layer instead.

D1 remains the cloud authority. Migration `0026_offline_first_cloud_sync.sql` adds:

- `offline_sync_mutations`: idempotency receipts for reconnect retries.
- `world_maps`: revisioned JSON map documents for the future world/map editors.

## Authentication and privacy

Offline data is scoped to the last Better Auth user successfully verified on the device. The local layer stores only that user id as its account namespace. It does not mint JWTs, persist session secrets, or create a second authentication system.

When the network returns, cloud synchronization requires the normal Better Auth session. If that session is gone, queued saves remain local until the user signs in again.

## Reads

Supported JSON GET requests use network-first behavior:

1. Read from the server when reachable.
2. Cache successful JSON by authenticated user and request path.
3. Fall back to that cached response when the network is unavailable.

`GET /api/sync/bootstrap` refreshes the local resource-version ledger and primes the user's campaign list, character library, campaign details, worlds, and map documents.

## Writes and replay

Supported draft/save writes receive a stable `X-Endless-Codex-Mutation-Id`. When the network is unavailable, the request is serialized into IndexedDB and optimistic local state can be returned to the UI.

On reconnect, queued writes replay oldest-first. The server stores the first successful response for each mutation id. If the browser lost the response and retries, D1 returns the stored response instead of applying the same mutation twice.

Temporary ids used by locally created campaign/character drafts are aliased to the server-assigned ids after the create request reaches D1. Later queued URLs resolve those aliases before replay.

## Conflict handling

Resources use optimistic versions:

- campaigns, characters, and worlds use monotonic `updated_at` values;
- maps use an integer `revision`.

A queued write includes the cloud version it was based on. If the server has a different version, replay stops that mutation with `OFFLINE_SYNC_CONFLICT` rather than silently overwriting either side.

The header save-status panel offers two explicit resolutions:

- **Keep this device**: replay the local mutation with `local-wins` after the user chooses it.
- **Use cloud copy**: discard queued mutations for that conflicted resource and refresh from D1.

Rejected non-conflict saves remain visible and can be retried.

## What can be saved offline

The offline queue is intentionally limited to JSON persistence that can be reconciled safely: campaign draft create/edit/delete, character draft field/selection saves, and map document CRUD. Cached GETs make previously loaded campaign/character/reference data available during an outage.

Authoritative or random operations stay online-only: ability-score rolls, starting-wealth rolls, character finalization, campaign start/pause/resume, AI Dungeon Master turns, player roll resolution, combat/game commands, inventory/XP mechanics, and other live session state. Those operations must execute against current D1 state and the deterministic rules engine.

## Deployment

Code can deploy before migration 0026 without breaking existing online writes: the sync middleware detects whether the sync tables exist and becomes a pass-through until they do. The `/api/sync/*` and map persistence features require migration 0026 to be present.

Apply migrations using the repository's normal migration commands. Remote D1 migrations are an explicit deployment action and should not be run implicitly by application code.
