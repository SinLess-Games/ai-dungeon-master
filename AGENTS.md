# AGENTS.md

## Project and working approach

The Endless Codex is a rules-aware tabletop RPG platform focused on a playable
D&D 3.5 experience with an AI Dungeon Master. It is a Cloudflare modular monolith.
The implementation, `package.json`, and active configuration are authoritative;
README, roadmap, schema comments, and older architecture descriptions may be stale.
Do not infer feature completeness from dependencies, seeded content, or roadmap claims.

Before substantial implementation:

1. Check `git status --short` and preserve unrelated changes.
2. Read `package.json`, `tsconfig.json`, `vite.config.ts`, and `wrangler.jsonc`.
3. Inspect the relevant feature, neighboring patterns, schema, migrations, and docs.
4. Search for existing helpers and UI primitives before creating replacements.
5. Implement the requested vertical slice, including authorization and persistence.
6. Run relevant checks and review the final diff for unrelated or generated changes.
7. Report what changed, what was actually verified, and any remaining blockers.

Keep changes focused. Do not rewrite published history, force-push, delete existing
data to fix a migration, or introduce unrelated dependency/formatting churn.
Do not import production code from `old/`; consult it only for behavior or migration.
Do not stop at scaffolding when the task calls for a working feature.

## Stack and runtime

Use package versions from `package.json` and the lockfile rather than this document.
The stack includes React 19, TypeScript, Vite, TanStack Router/Query, Zustand, Hono
and Hono RPC, Drizzle/D1, Better Auth, Tailwind CSS 4, Base UI, Vitest, and Playwright.
Cloudflare provides R2, Workers AI, Durable Objects, Queues, and KV. Stripe,
Capacitor (Android), Tauri (desktop), and Vercel AI SDK packages are also present;
verify the actual integration before claiming support.

This is a Vite SPA, not TanStack Start. Do not introduce Next.js, Nitro, Lovable
runtime dependencies, Supabase Auth/Storage, a separate Node API server, a second
authentication system, or a second database abstraction beside Drizzle.

```text
Browser / React -- same origin --> Cloudflare Worker
                                    |-- Vite assets / SPA routes
                                    |-- /api/* --> Hono --> feature services
                                    |                       |-- Better Auth
                                    |                       |-- D1 / Drizzle, R2
                                    |                       |-- Workers AI
                                    |                       |-- CampaignRoom
                                    |-- scheduled --> devblog automation
                                    |-- queue --> committed-event post-processing
```

- `src/server/worker.ts`: fetch, scheduled, and queue entrypoints; exports `CampaignRoom`.
- `src/server/app.ts`: Hono route assembly, middleware, and health endpoints.
- `vite.config.ts`: router generation and Cloudflare Worker integration.
- `wrangler.jsonc`: active bindings, assets, routes, schedules, and deployment settings.

Keep `worker.ts` small and business workflows out of `app.ts`.
`npm run dev` starts the integrated Vite/Worker server on port 5173. Its `predev`
hook **applies local D1 migrations**. `npm run dev:raw` starts the same server
without that hook; it does not repair an incompatible or missing schema.
Do not add another application development server. Existing isolated test harnesses
may start their own disposable Vite/Worker instance.

## Code map and dependencies

| Area                             | Location                                                             |
| -------------------------------- | -------------------------------------------------------------------- |
| File routes                      | `src/app/routes/`                                                    |
| Generated route tree             | `src/routeTree.gen.ts`                                               |
| Feature modules                  | `src/modules/<feature>/`                                             |
| Generic deterministic engine     | `src/engine/`                                                        |
| Ruleset registry and D&D runtime | `src/rulesets/`, `src/rulesets/dnd35/`                               |
| Database client and schemas      | `src/infrastructure/database/`                                       |
| Typed browser API client         | `src/infrastructure/api/client.ts`                                   |
| AI provider adapter              | `src/infrastructure/ai/openaiCompatible.ts`                          |
| Background event processing      | `src/infrastructure/cloudflare/backgroundJobs.ts`                    |
| Live campaign coordination       | `src/modules/game/live/CampaignRoom.ts`                              |
| Reusable UI                      | `src/ui/primitives/`, `src/components/ui/`, `src/components/layout/` |

Features include `auth`, `admin`, `profile`, `feedback`, `devblog`, `campaigns`,
`characters`, `game`, and `dice`. Use `domain/`, `server/`, `client/`, and `ui/`
where needed; do not create empty directories merely to satisfy a template.

Prefer routes/UI → feature services → domain/ruleset → engine dependencies.
Infrastructure supplies persistence and provider adapters. Avoid circular imports
and server runtime imports into browser code; use type-only imports for API types.
The generic engine must not depend on application modules or a particular ruleset.

Follow existing TanStack Router file-route conventions. Let the Vite router plugin
generate the route tree; never hand-edit `src/routeTree.gen.ts`.

## Server APIs and authorization

Use Hono and chained `.route(...)` assembly that preserves the exported `AppType`
and Hono RPC inference. Keep handlers thin: validate input, authenticate/authorize,
then call services and repositories. Derive browser API types from the server
where practical. Preserve same-origin browser requests; explicit origins are only
needed for native clients or other established use cases.

Use existing errors in `src/server/middleware/errors.ts` and existing validation
patterns (`zod`, `@hono/zod-validator`). Public responses must not expose stack
traces, SQL errors, credentials, or private fields.

Better Auth owns authentication. Reuse `src/modules/auth/server/auth.ts` and
`requireAuth.ts`. Global roles are exactly `user` and `admin`; there is no separate
admins table. Campaign membership roles are `owner`, `gm`, `player`, and `observer`,
with membership status checked separately.

- Derive identity from the authoritative server session, never client user IDs or roles.
- Enforce admin writes on the server even when the UI hides controls.
- Check campaign access, membership status, and actor/character control as appropriate.
- Check that referenced actors, targets, encounters, and resources belong to the campaign.
- Preserve authorization on WebSocket upgrades and presence reads. Only the server
  may set the internal identity headers forwarded to `CampaignRoom`.
- Do not add custom password hashing, JWT auth, or browser token storage beside Better Auth.

Keep public, private, and admin DTO boundaries explicit. An admin response must
still exclude password hashes, OAuth/session tokens, and unnecessary personal data.

## Cloudflare and secrets

Bindings are environment scoped. Create Drizzle using `createDatabase(binding)`
from `src/infrastructure/database/client.ts`; never construct a global D1 client
that assumes a binding exists at import time. Do not use Node-only SQLite libraries
in production Worker code. `tests/helpers/sqliteD1.ts` uses `node:sqlite` for tests.

| Binding             | Purpose                                                                      |
| ------------------- | ---------------------------------------------------------------------------- |
| `DB`                | Authoritative D1 application state                                           |
| `R2_BUCKET`         | File/image bytes; metadata lives in D1                                       |
| `AI`                | Preferred Workers AI provider                                                |
| `CAMPAIGN_ROOM`     | Campaign-scoped Durable Object for WebSockets/presence                       |
| `BACKGROUND_QUEUE`  | Post-processing committed game events                                        |
| `RUNTIME_CACHE`     | KV runtime cache, not authoritative game state                               |
| `GITHUB_SYNC_QUEUE` | Configured queue binding; inspect handlers before assuming a workflow exists |

Preserve D1 authority across live delivery and background work. Publish/enqueue game
events after persistence succeeds. Immediate and queued broadcasts can duplicate an
event; consumers must deduplicate by event ID/sequence and recover state from D1.
Do not make rules decisions from KV caches or client WebSocket messages.

Anything prefixed `VITE_` is browser-visible. Keep Better Auth secrets, OAuth client
secrets, Stripe secrets, AI API keys, GitHub credentials, Cloudflare tooling tokens,
and seed passwords server-only. Use ignored private environment files for local
secrets and Cloudflare secret management for production. Never print, commit,
snapshot, or echo real secrets, including while inspecting environment files.

When bindings change, run `npm run cf:typegen` and review the generated
`worker-configuration.d.ts` and affected environment interfaces.

## Database, migrations, and seeds

Schema modules live in `src/infrastructure/database/schema/` and are exported through
`index.ts`. Use `drizzle-orm` and `drizzle-orm/sqlite-core` with SQLite/D1-compatible
APIs. Use camelCase TypeScript fields, snake_case database identifiers, and explicit
constraints/indexes for real invariants and query patterns. Store bytes in R2, not D1.

Preserve the distinction between generic identity/state, ruleset-specific state,
and reusable content definitions. Generic roots for worlds, campaigns, memberships,
characters, actors, sessions, events, and encounters already exist. Do not create
replacement roots or placeholder foreign keys.

`schema/dnd35/character.ts` is a ruleset extension keyed by the generic character ID.
Its comment claiming no generic character table exists is stale. It currently has
no foreign key to that root, so inspect explicit cleanup paths when changing
creation/deletion; do not assume a database cascade handles the extension.
Keep generic ownership, names, portraits, and lifecycle fields out of D&D extensions.
A monster definition is distinct from a persistent actor/monster instance.

### Migrations

SQL migrations live under `drizzle/`; `drizzle.config.ts` owns generation and
Wrangler applies migrations using `wrangler.jsonc`.

- `npm run db:generate`: generate from the Drizzle schema/snapshots.
- `npm run db:migrate:local`: apply pending migrations to local D1.
- `npm run db:migrate:remote`: apply to remote D1 **only when explicitly requested**,
  after reviewing the SQL.

Inspect **both SQL files and metadata** before generating. The checked-in Drizzle
journal/snapshots currently stop at `0004`, while later SQL migrations extend past
that point; there are also two `0012_*.sql` files. Generation against stale snapshots
can recreate existing changes. Reconcile the actual migration history deliberately
before accepting generated SQL. Do not rename applied migrations or hand-edit
`drizzle/meta/*` to conceal the mismatch.

Auth/devblog docs describe a historical local database with a legacy `campaigns`
table that conflicts with `0001_complete_black_widow.sql`. Inspect the actual local
schema and migration ledger before assuming that problem still applies. Preserve
existing data; do not delete `.wrangler` state, bypass a conflicting migration, or
mark it applied without verifying its effects. Prefer disposable databases for
migration tests. Never apply remote migrations as a side effect of local validation.

### Content seeds

Read `docs/content-seeding.md` before changing seeds or the runner.
D&D content lives under `seeds/dnd3-5/`, with dependency order in `seed-order.json`.
The runtime ruleset ID is `dnd35`; do not confuse it with the seed directory name.

Use `scripts/seed-content.mjs` through the npm scripts. `db:seed:local` includes
local migrations; `db:seed:remote` does not apply migrations and requires an explicit
remote task. The runner prompts once; `-- --yes` supports already-authorized
unattended runs. Selected seed groups do not automatically include dependencies.

Preserve `codex_seed_history` paths, checksums, and claim states. Changed files run
in full, so use explicit updates/upserts where needed. Do not bypass history by
executing seed files directly against an existing database. An unfinished `started`
claim requires inspection and repair; never clear or mark it applied blindly.
`--mark-applied` is only for content whose effects have been verified. Administrator
seeding is a separate Better Auth workflow.

## Campaign and character lifecycle

The implemented flow is **campaign first**:

```text
Authenticated user -> campaign draft -> character creation/readiness
                   -> Start Campaign -> generated world + active session/play
```

Reuse `src/modules/campaigns/domain/lifecycle.ts`, `server/startCampaign.ts`, and
`server/d1StartRepository.ts`. Draft/ready campaigns have no world; starting creates
one. Active/paused/completed campaigns require a world and start timestamp.
Starting requires a rules-valid ready character with a matching ruleset/version.
Preserve atomic start/completion transitions and recovery of failed generation.

`BootstrapWorldGenerator` creates a minimal world root and generation metadata;
it does not implement full region, map, settlement, or NPC generation. Do not
claim that richer world generation exists because campaign start succeeds.

Character creation lives in `src/modules/characters/`, including persisted choices,
creation progress, readiness validation, and finalization. Reuse server access
checks and domain validators. Preserve edit restrictions once campaign start begins,
and validate readiness on the server rather than trusting UI completion flags.

## Engine, rulesets, and authoritative play

The engine is implemented in `src/engine/`; D&D 3.5 behavior is implemented in
`src/rulesets/dnd35/`. Read `docs/engine.md` and `docs/dnd35-ruleset.md` for changes
in those areas. ESLint enforces important engine import boundaries.

- Keep the engine free of React, Hono, Drizzle, Cloudflare, providers, and feature imports.
- Keep D&D-specific math and policies in the ruleset; generic primitives stay generic.
- Use pure functions with explicit state and injected randomness/time for determinism.
- Return structured results/events/deltas; persistence belongs in application services.
- Reuse ruleset calculations for modifiers, prerequisites, derived stats, combat,
  conditions, health, casting, psionics, resources, and progression.
- Test rule boundaries, invalid actions, resource expenditure, and failure behavior.
  A content row or descriptive rule text does not prove executable rule support.

Authoritative play services live in `src/modules/game/server/`. Extend the existing
`gameCommandService.ts` dispatch boundary and validated `gameCommandRoutes.ts` for
shared UI/AI commands. It covers encounters, attacks, checks, spellcasting, and
power manifestation. The dispatcher alone does not authenticate a caller: preserve
authorization before dispatch and rule/state validation within handlers.

Persist coupled state changes and their events atomically using the established
D1 store/batch patterns. Preserve concurrency checks and reject invalid actions
before spending resources. Engine in-memory transactions do not automatically
provide database transaction guarantees.

The personal `/dice` page and dice tray are browser utilities. Their stored roll
history must never replace authoritative server rolls or mutate campaign state.

## AI and live play

The AI DM narrates and orchestrates. Free-form model text must never silently mutate
game state, and providers must never receive unrestricted database access. New AI
tools must use explicit validated application commands and authoritative reads.
Structured planning runs through `dmTurnOrchestrator.ts` and the bounded `dmToolLoop.ts`;
inspect those paths when extending AI-triggered mechanics.

`src/modules/campaigns/server/structuredPlayMessageRoutes.ts` handles message creation;
`playMessageRoutes.ts` retains history and message management. Campaign/private replies
and post-roll narration support SSE; read `docs/ai-dm-streaming.md` before changing the
transport. Preserve JSON client compatibility, completion-only DM persistence, and
private channel isolation in history, AI context, and live delivery. Never broadcast
partial drafts or replay a mutating POST automatically after a stream interruption.

`src/infrastructure/ai/openaiCompatible.ts` prefers the `AI` binding, with an optional
OpenAI-compatible fallback. Read `docs/cloudflare-workers-ai.md` for configuration.
Use `AI_GAME_MODEL` and `AI_DEVBLOG_MODEL` from the environment; do not scatter model
IDs or require an OpenAI key for the Workers AI path. Automated tests should use
mocks; local Workers AI calls may access the real service.

Devblog automation has scheduled and admin-triggered generation. Preserve its enable
and auto-publish settings; read `docs/devblog-ai.md` before changing that workflow.

## UI and feature safeguards

Reuse existing primitives and feature styling. Preserve the dark fantasy direction,
restrained gold accents, etched/arcane details, readable typography, responsive
layouts, and accessible keyboard/focus behavior. Keep feature components in feature
modules, and do not redesign unrelated pages.

For devblog changes, preserve non-public drafts/archives, server-protected admin
writes, validated image uploads, Markdown without arbitrary raw HTML, comment
moderation, and public DTO privacy. Do not casually accept SVG uploads.

Use strict TypeScript, narrow types, explicit unions, inferred Drizzle/Hono types,
and type-only imports. Respect `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`,
and the other active compiler options. Do not silence errors with `any` or broad
unsafe casts without a specific documented boundary. Use `@/` and established aliases.
Formatting follows `.prettierrc`: double quotes, semicolons, trailing commas,
two-space indentation, and 100-character print width.

## Validation and generated files

Use actual `package.json` scripts and scope verification to the change.

| Change / purpose               | Checks                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Documentation only             | Prettier on touched files; verify paths/commands; `git diff --check`             |
| TypeScript / application logic | `npm run typecheck`, `npm run lint`, relevant `npm run test:unit -- <test-path>` |
| Engine/ruleset work            | Typecheck, lint, unit suite, and build per the feature docs                      |
| Routes, UI, Worker integration | `npm run build` and relevant browser/integration flow                            |
| General browser smoke tests    | `npm run test:e2e`                                                               |
| Campaign creation / play       | `npm run test:e2e:campaign`, `npm run test:e2e:campaign-play`                    |
| Character creation             | `npm run test:e2e:creator`                                                       |
| Authentication                 | `npm run test:auth:integration`, `npm run test:auth:browser`                     |
| Devblog                        | `npm run test:devblog`                                                           |
| Seed changes                   | `npm run test:unit:seeds` and relevant schema/runner tests                       |
| Coverage                       | `npm run test:coverage`                                                          |
| Deployment packaging           | `npm run deploy:check` (build/typecheck + Wrangler dry-run)                      |

`npm run check` runs typecheck, lint, and unit tests; it does not include formatting,
build, or browser tests. `npm run build` includes typecheck. `test:unit:ci` excludes
seed-named tests, so it does not replace seed validation. Unit tests use Vitest in
Node; component tests can opt into jsdom. Some database tests require `node:sqlite`.

`test:e2e` uses `playwright.config.ts`, starts `npm run dev` unless `E2E_BASE_URL` is
set, and may therefore migrate local D1. The campaign/creator `.e2e.mjs` harnesses
are separate npm commands and use disposable Worker/D1 state; Playwright's general
suite does not run them automatically. Inspect setup/cleanup before running any
integration script against an existing or remote environment. Mock-provider E2E
success does not prove live Workers AI availability.

Format touched files instead of running repository-wide `npm run format` for a
focused change. Do not hand-edit `src/routeTree.gen.ts`, `worker-configuration.d.ts`,
or `drizzle/meta/*`; use their owning generators and review the diff.
Report pre-existing failures separately and never claim a migration, provider call,
browser flow, or deployment was tested unless it was actually executed.

## Documentation map

Read the relevant document before substantial work; verify claims against code.

| Area                     | Documentation                                                     |
| ------------------------ | ----------------------------------------------------------------- |
| Setup and overview       | `README.md`                                                       |
| Engine and ruleset       | `docs/engine.md`, `docs/dnd35-ruleset.md`                         |
| D&D schema and content   | `docs/dnd35-database-schema.md`, `docs/content-seeding.md`        |
| Authentication           | `docs/authentication.md`, `docs/auth-database-schema.md`          |
| Admin, feedback, profile | `docs/admin-panel.md`, `docs/feedback.md`, `docs/user-profile.md` |
| Devblog                  | `docs/devblog.md`, `docs/devblog-ai.md`                           |
| AI configuration         | `docs/cloudflare-workers-ai.md`                                   |
| Historical planning      | `roadmap.md` (verify status in code)                              |

Update documentation when changing an established workflow, route, schema invariant,
environment requirement, or operator command. Keep this guide focused on durable
boundaries and useful entrypoints rather than duplicating feature documentation.
