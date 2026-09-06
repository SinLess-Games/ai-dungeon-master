# AGENTS.md

## Project

The Endless Codex is a rules-aware tabletop RPG platform focused first on a
fully playable D&D 3.5 experience with an AI Dungeon Master.

The current rebuild is a Cloudflare-based modular monolith. Treat the code in
this repository as authoritative. Older project descriptions, legacy Lovable
architecture, and historical roadmap claims may be stale.

The near-term product goal is:

1. authenticate a player,
2. create/select a persistent world,
3. create/select a campaign,
4. create and manage a rules-valid D&D 3.5 character,
5. enter a playable campaign,
6. let the AI DM narrate and orchestrate play through explicit game-state tools,
7. keep deterministic rules and persistent state authoritative outside the AI.

Do not mark a feature complete merely because an older roadmap says it was
implemented. Inspect the current code first.

---

## Current stack

Use the versions and packages in `package.json` as the source of truth.

Current architecture:

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Query
- Zustand where small global UI state is useful
- Hono on Cloudflare Workers
- Hono RPC for typed application APIs
- Cloudflare D1
- Drizzle ORM
- Cloudflare R2
- Better Auth with the Admin and Username plugins
- Stripe
- Tailwind CSS 4
- Base UI / project UI primitives
- Vitest
- Playwright
- Capacitor for Android
- Tauri for Windows desktop
- Vercel AI SDK / OpenAI-compatible providers for future AI features

This is NOT a TanStack Start application.

Do NOT reintroduce:

- Lovable runtime dependencies
- Supabase Auth or Supabase Storage
- Nitro
- Next.js
- a separate Node API server
- a second authentication system
- a second database abstraction beside Drizzle

---

## Runtime architecture

The app is one Cloudflare application.

```text
Browser / React
      |
      | same origin
      v
Cloudflare Worker
      |
      +-- static Vite assets / SPA routes
      |
      +-- /api/* -> Hono
                     |
                     +-- Better Auth
                     +-- D1 / Drizzle
                     +-- R2
                     +-- Stripe
                     +-- future AI/game APIs
```

`wrangler.jsonc` is the active Cloudflare configuration.

The Worker entrypoint is:

```text
src/server/worker.ts
```

The main Hono application is assembled in:

```text
src/server/app.ts
```

Keep `worker.ts` intentionally small.

Do not create a second development server. `npm run dev` runs Vite with the
Cloudflare Vite plugin and Worker runtime integration.

---

## Frontend routing

TanStack Router file routes live under:

```text
src/app/routes/
```

The generated route tree is:

```text
src/routeTree.gen.ts
```

Do not hand-edit `src/routeTree.gen.ts`.

The router plugin is configured in `vite.config.ts`.

When adding routes, follow the existing `src/app/routes` conventions.

---

## Module architecture

Application features belong under:

```text
src/modules/<feature>/
```

Prefer feature modules shaped roughly as needed:

```text
src/modules/<feature>/
  domain/
  server/
  client/
  ui/
```

Existing examples include:

- `src/modules/auth/`
- `src/modules/admin/`
- `src/modules/devblog/`
- `src/modules/feedback/`
- `src/modules/profile/`

Do not create folders merely to satisfy a template. Keep files focused and
follow the patterns already used by neighboring modules.

Prefer this dependency direction:

```text
UI / routes
    -> feature modules
        -> domain / engine
            -> shared primitives

Infrastructure plugs into features from the outside.
```

Avoid circular imports between modules.

---

## Server/API conventions

Use Hono for application APIs.

Prefer route assembly with `app.route(...)` so Hono RPC types remain useful.

Keep route handlers thin. Prefer:

```text
route
  -> service/business logic
  -> repository/data access
  -> Drizzle/D1
```

Do not put large SQL/business workflows directly in `src/server/app.ts`.

Application API types should be derived from the Hono server where practical
rather than duplicated by hand in the browser.

The shared Hono client currently lives under:

```text
src/infrastructure/api/
```

Preserve same-origin browser API behavior unless a native client specifically
requires an explicit API origin.

Use the existing error classes and response conventions in:

```text
src/server/middleware/errors.ts
```

Do not expose internal stack traces, SQL errors, secrets, tokens, or provider
credentials to public clients.

---

## Cloudflare bindings

Current bindings are defined in `wrangler.jsonc`.

Important bindings include:

```text
DB        -> Cloudflare D1
R2_BUCKET -> Cloudflare R2
```

Cloudflare bindings are request/environment scoped.

Do not create a global/module-level D1 connection that assumes a binding exists
at import time.

Create Drizzle from the request's D1 binding through the existing database
client pattern.

Do not use Node-only SQLite libraries such as `better-sqlite3` in production
Worker code.

---

## Database and Drizzle

Database schema lives under:

```text
src/infrastructure/database/schema/
```

The schema barrel is:

```text
src/infrastructure/database/schema/index.ts
```

Current major schema areas include:

- auth
- campaign
- devblog
- feedback
- D&D 3.5 rules/content/state

Use:

```text
drizzle-orm
ndrizzle-orm/sqlite-core
```

for D1/SQLite-compatible schema work.

Use camelCase in TypeScript and snake_case for database identifiers.

Use explicit constraints and indexes where they protect invariants or support
real query patterns.

Do not use PostgreSQL-only types or APIs.

Do not store image/file bytes or base64 blobs in D1. Store metadata in D1 and
bytes in R2.

### Migrations

Active migrations are under:

```text
drizzle/
```

Generate migrations with:

```sh
npm run db:generate
```

Apply local migrations with:

```sh
npm run db:migrate:local
```

Apply remote migrations only when explicitly requested and after reviewing the
SQL:

```sh
npm run db:migrate:remote
```

Never blindly mark a migration complete.

Important current repository state: the developer's existing local D1 may
contain a legacy `campaigns` table that conflicts with an older campaign
migration. Auth/devblog documentation describes this. Preserve existing data
and resolve that migration deliberately rather than deleting or bypassing it.

---

## Authentication and authorization

Authentication is owned by Better Auth.

Key implementation areas:

```text
src/modules/auth/
src/infrastructure/database/schema/auth/
```

Global application roles are currently exactly:

```text
user
admin
```

Do not create a separate admins table.

Do not mix campaign/game roles into global auth roles.

Examples of NON-global roles:

```text
campaign owner
game master
player
spectator
```

Those belong in campaign membership/authorization data.

Never trust client-supplied:

- user IDs
- admin flags
- roles
- ownership claims

Derive identity and privileges from the authoritative server-side session.

Admin-only endpoints must enforce admin authorization on the server even when
the UI also hides admin controls.

Do not implement custom password hashing, custom JWT auth, or browser token
storage beside Better Auth.

Do not put auth secrets into `VITE_` environment variables.

---

## Secrets and environment variables

Anything prefixed with `VITE_` is browser-visible.

Never put server secrets in `VITE_` variables.

Examples of server-only secrets include:

- `BETTER_AUTH_SECRET`
- OAuth client secrets
- `STRIPE_API_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Cloudflare API/D1 tooling tokens
- seed passwords

Local Worker secrets belong in ignored private environment files such as
`.dev.vars`.

Production secrets should be configured through Cloudflare secret management or
the deployment system.

Never print, commit, snapshot, or echo real secret values.

---

## D&D 3.5 architecture

The D&D 3.5 schema lives under:

```text
src/infrastructure/database/schema/dnd35/
```

Keep a strict distinction between:

1. generic platform identity/state,
2. ruleset-specific D&D 3.5 state,
3. reusable rules/content definitions.

Examples:

```text
Generic Character
    -> D&D 3.5 Character extension

Generic Campaign
    -> rulesetId = dnd35
    -> D&D-specific settings/state elsewhere

Monster definition
    != persistent world NPC instance
```

Do not place D&D-specific columns into generic platform tables when the data
belongs to the D&D ruleset.

Conversely, do not duplicate generic ownership, identity, campaign membership,
name, portrait, or platform lifecycle fields inside D&D extension tables.

The current D&D character extension intentionally expects a future generic
character root. Preserve that separation when implementing characters.

Rules/content tables should remain usable for seeded official/open content and
homebrew/custom content where supported.

---

## Rules engine direction

The deterministic game engine should eventually live under:

```text
src/engine/
```

Ruleset-specific runtime behavior should live under something like:

```text
src/rulesets/dnd35/
```

The generic engine must not depend on the D&D 3.5 ruleset.

The engine should not import React, Hono, Cloudflare bindings, Drizzle, or AI
provider code.

Prefer pure functions and deterministic calculations for:

- dice
- modifiers
- prerequisites
- derived statistics
- conditions
- combat resolution
- resource changes
- progression

The database stores state. The engine interprets rules. UI presents state.

Do not put rules math directly into React components when it belongs in the
engine.

---

## AI Dungeon Master direction

The AI DM is a narrator/orchestrator, not the authoritative rules engine or
primary database writer.

AI-triggered game changes should go through explicit validated tools such as:

```text
getCharacter
getCampaign
makeSkillCheck
makeSavingThrow
makeAttack
applyDamage
applyHealing
applyCondition
grantXp
grantItem
createNpc
advanceTime
recordEvent
```

Do not give an AI provider unrestricted database access.

Do not let free-form model text silently mutate game state.

The server validates tool inputs, ownership, campaign permissions, and rule
constraints before committing state.

---

## Worlds, campaigns, and characters

These are core game concepts and should be implemented as first-class modules,
not one-off page state.

Target relationship:

```text
User
  -> World
       -> Campaign
            -> Campaign Memberships
            -> Generic Character
                 -> Ruleset extension (for example D&D 3.5)
```

The generic campaign schema already references `worldId` and a ruleset ID/version.
Do not invent placeholder foreign keys just to satisfy compilation; implement
coherent generic roots when the corresponding feature is built.

Server ownership/authorization must be enforced for all private world,
campaign, and character operations.

---

## Devblog

The public devblog is implemented under:

```text
src/modules/devblog/
src/app/routes/devblog/
src/infrastructure/database/schema/devblog/
```

D1 stores post/comment/media metadata and R2 stores image bytes.

Markdown is rendered without arbitrary raw HTML.

Preserve the current security properties:

- draft/archived posts are not public
- admin writes are server-protected
- image uploads are validated
- SVG is not casually accepted as an image upload
- public comments are moderated
- public DTOs do not leak moderation/private fields

See `docs/devblog.md` before making substantial devblog changes.

---

## Admin panel

The admin panel is implemented under:

```text
src/modules/admin/
src/app/routes/user/admin.tsx
```

Admin endpoints use authoritative Better Auth session checks.

Preserve private DTO boundaries. Never return password hashes, OAuth tokens,
session tokens, secrets, or unnecessary personal information to the admin UI.

See `docs/admin-panel.md` before making substantial admin changes.

---

## UI conventions

Reuse existing project UI primitives and established styling before adding new
component systems.

Current UI is split between established reusable locations including:

```text
src/ui/primitives/
src/components/ui/
src/components/layout/
```

Before creating another primitive, search for an existing equivalent.

Feature-specific UI belongs in its feature module.

Do not place large feature components in generic primitive folders.

Preserve the current Endless Codex visual direction:

- dark fantasy
- restrained gold accents
- etched/arcane details
- readable typography
- responsive layouts
- accessible keyboard/focus behavior

Do not redesign unrelated pages as collateral work.

---

## TypeScript conventions

The repository uses strict TypeScript settings.

Important compiler behavior includes:

- `strict`
- `exactOptionalPropertyTypes`
- `noUncheckedIndexedAccess`
- `noImplicitReturns`
- `noImplicitOverride`

Do not silence errors with `any` or broad unsafe casts unless there is a
specific documented boundary requiring it.

Prefer narrow types, explicit unions, and inferred Drizzle/Hono types.

Use type-only imports where appropriate.

Use the `@/` alias for `src/` imports and follow existing aliases in
`tsconfig.json`.

Formatting uses double quotes, semicolons, trailing commas, and a 100-character
print width.

---

## Generated files

Do not hand-edit generated files unless the repository specifically requires a
manual patch and the reason is documented.

Important generated artifacts include:

```text
src/routeTree.gen.ts
drizzle/meta/*
```

Generate them through their owning tools.

Review generated migration SQL before applying it.

---

## Testing and validation

Use the actual scripts in `package.json`.

Common commands:

```sh
npm run dev
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run check
npm run test:unit
npm run test:e2e
npm run db:generate
npm run db:migrate:local
```

Feature-specific verification scripts currently include:

```sh
npm run test:auth:integration
npm run test:auth:browser
npm run test:devblog
```

Run checks appropriate to the change.

For focused changes, prefer formatting touched files rather than causing
unrelated repository-wide churn.

Report pre-existing failures separately from failures introduced by your work.

Do not claim a provider integration, migration, deployment, browser flow, or
remote operation was tested unless it was actually executed.

---

## Git and change discipline

Preserve unrelated working-tree changes.

Do not rewrite published history unless the user explicitly asks for it.

Avoid:

- force pushes
- destructive rebases on shared branches
- broad mechanical rewrites unrelated to the task
- deleting existing data to make a migration pass
- dependency churn without a reason

When a task requires several architectural changes, inspect the repository
first and make one coherent implementation rather than repeatedly redesigning
the same boundary file-by-file.

Do not import production code from legacy directories such as `old/` if such a
directory exists. Legacy code may be consulted for behavior/data migration only.

---

## Documentation

Relevant project documentation currently includes:

```text
docs/authentication.md
docs/auth-database-schema.md
docs/admin-panel.md
docs/devblog.md
docs/dnd35-database-schema.md
docs/feedback.md
docs/user-profile.md
README.md
roadmap.md
```

Documentation can be stale. The implementation and current package/config files
win when they disagree with historical docs.

Update documentation when a task materially changes an established workflow,
public route, schema invariant, environment requirement, or operator command.

---

## Before implementing a substantial task

1. Read `package.json`, `tsconfig.json`, `vite.config.ts`, and `wrangler.jsonc`.
2. Inspect the feature module and neighboring patterns.
3. Inspect relevant schema and migrations.
4. Read feature-specific docs when present.
5. Search for existing helpers/primitives before inventing replacements.
6. Preserve unrelated changes.
7. Implement the complete vertical slice required by the task.
8. Validate with the relevant npm scripts.
9. Report what changed, what was tested, and any pre-existing blockers.

Do not stop at scaffolding when the user asked for a working feature.