# Roadmap — D&D 3.5 AI Dungeon Master

Repository audit: September 15, 2026. Checked items have implementations in the
current source tree. Unchecked parent items may have completed parts listed below
them; schemas, content seeds, and configuration alone do not complete a playable
feature. This audit does not certify production deployment or live provider setup.

## Phase 1 — Playable solo core

- [x] Auth (email + Google), roles, schema, and offline-first cloud-sync foundation
  - [x] Better Auth email/password and Google OAuth integration, global user/admin roles, and persistent application schema. Google requires configured credentials. See [auth](src/modules/auth/server/auth.ts) and [schema](src/infrastructure/database/schema/index.ts).
  - [x] Offline-first save/sync foundation: IndexedDB-backed local cache, service-worker application shell, ordered queued mutation replay, server-side idempotency receipts, optimistic resource-version conflict detection, explicit keep-device/use-cloud conflict handling, temporary-id aliasing, reconnect synchronization, account-scoped campaign/character caches, and cloud-backed world-map documents. See [offline infrastructure](src/infrastructure/offline/) and [world-map schema](src/infrastructure/database/schema/worldMap.ts). Full cloud synchronization in a deployed environment requires migration `0026_offline_first_cloud_sync.sql` to be applied there; this roadmap update does not apply migrations remotely.
- [x] Design system (dark arcane theme, fonts) — [theme tokens and typography](src/styles/styles.css), shared primitives, and feature styling are implemented.
- [x] Rules data: races, base classes, skills, feats, alignments — [D&D content seeds](seeds/dnd3-5/) and [alignment definitions](src/infrastructure/database/schema/dnd35/primitives.ts) exist. This checks off the core data catalog, not every sourcebook mechanic or deployment of those seeds.
- [x] Rules engine: derived stats, encumbrance (toggleable)
  - [x] Deterministic [derived character stats](src/rulesets/dnd35/derivedCharacter.ts) and [carrying capacity/load classification](src/rulesets/dnd35/encumbrance.ts).
  - [x] Live `encumbranceEnabled` toggle, carried-weight classification, movement/run/Max-Dex/armor-check restrictions, and authoritative skill-check/target-AC integration. Armor and load restrictions use the worse applicable restriction rather than stacking the same restriction twice; equipped armor movement/run restrictions remain authoritative even when carried-load penalties are disabled.
- [x] Dice roller with large-roll support (100d6+) — [dice page/tray](src/modules/dice/ui/), shared saved history, and [notation engine](src/engine/diceNotation.ts) support up to 1,000 dice per expression.
- [x] Local save layer (swap to Cloud when available) — the merged offline-first layer provides IndexedDB persistence, offline reads for cached save data, queued/replayed supported draft mutations, explicit conflict resolution, reconnect synchronization, and global save/sync status. Authoritative/random transitions remain intentionally online-only rather than being fabricated locally.
- [x] Dashboard — implemented as the [campaign management hub](src/modules/campaigns/ui/CampaignsHub.tsx) and [character library](src/modules/characters/ui/CharacterLibrary.tsx), with saved records, campaign setup, start/resume, and deletion. There is no separate unified `/dashboard` page.
- [x] Character creator with inline explanations — [multi-step creator](src/modules/characters/ui/AdvancedCharacterCreator.tsx), persisted selections, explanatory content, and server readiness/finalization are implemented for supported starting characters. Later-level advancement remains separate work.
- [x] Character sheet (live, editable) — campaign play now exposes an authoritative live D&D 3.5 sheet with abilities, combat stats, HP, saves, skills, feats, classes, XP, alignment, editable identity/notes, an encumbrance toggle, and ongoing carried/stored/party inventory and equipment-slot editing. Inventory placement changes use the shared game-command boundary and emit auditable game events; owner/GM catalog grants and removals remain audited commands as well. Equipment validation covers mutually exclusive hand slots and the two exclusive standard ring slots.
- [x] Campaign setup wizard (style, type, length, pace, DM temperament, world notes, house rules)
  - [x] [Persistent seven-stage wizard](src/modules/campaigns/ui/CampaignCreator.tsx): style, structure, scale, pace, world profile, descriptions, rules, player permissions, DM behavior, and house-rule notes.
  - [x] [Campaign length/duration](docs/campaign-duration.md): short/medium/long/endless, optional session/level/ending targets, draft persistence/editing, and explicit AI DM pacing context. Targets guide narration without forcing mechanical outcomes.
- [x] Streaming AI DM with state tools, player rolls, grants, alignment tracking
  - [x] [Persistent campaign/private DM conversations](src/modules/campaigns/server/playMessageRoutes.ts) and generated AI replies.
  - [x] [Validated game commands](src/modules/game/server/gameCommandRoutes.ts) for encounters, attacks, checks, casting, and psionics, with player controls in campaign play.
  - [x] Structured AI DM player-roll loop: the model may request a validated skill check or saving throw, the player supplies the natural d20, and the deterministic game-command boundary resolves and persists the authoritative event before narration continues.
  - [x] Single-roll enforcement for DM-requested checks: the built-in d20 may only generate one natural result per pending action, the value locks on submission, transient retries reuse the same roll, and server-side duplicate-check detection prevents an already-resolved skill/save from being requested again for the same continuation.
  - [x] Current-turn progression anchoring: structured planning receives the exact current player message/action as the authoritative turn focus, historical conversation is context only, and a compact resolved-check ledger distinguishes current-turn results from older results so stale player actions/checks are not revived.
  - [x] Authoritative player Initiative before combat: when `encounter.start` includes the acting player character, the DM creates a first-class `check.initiative` request and waits for one player d20. The rules engine applies the character's authoritative Initiative modifier while other participants roll automatically, then encounter turn order is created from the resolved results. Migration `0027_ai_dm_initiative.sql` adds the action kind in deployed databases; this roadmap update does not apply it remotely.
  - [x] Authoritative AI DM state-tool loop: bounded model planning can start/finish encounters, make attacks, cast prepared/spontaneous spells, manifest powers, apply/remove conditions, and apply validated direct damage/healing through the same deterministic command boundary. Tool results are fed back to the planner before narration continues.
  - [x] Item and XP grant workflows: AI DM grants/removals resolve catalog/inventory references server-side and persist auditable inventory/XP game events instead of mutating state in narration.
  - [x] Ongoing alignment tracking: meaningful completed choices may produce bounded two-axis drift proposals; deterministic thresholds, persisted axis state, and `alignment.drift` events decide whether the public D&D alignment actually changes.
  - [x] [AI DM token streaming](docs/ai-dm-streaming.md): progressive campaign/private narration and post-roll replies, temporary drafts, completion-only persistence, cancellation, and JSON API compatibility. Structured commands remain validated before narration streams.
- [ ] Standalone world builder + world map — [campaign start](src/modules/campaigns/server/bootstrapWorldGenerator.ts) creates a minimal persistent world root and generation metadata, and the offline-first layer now includes cloud-backed world-map save documents. Standalone editing, generation, travel, and map display are still absent.

## Phase 2 — Reference, loot, export

- [ ] Rules wiki with search + filters — rules/content catalogs and creator search exist; a standalone wiki route and browsing UI do not.
- [ ] Loot tracking (on-person / stored / party) — the Phase 1 live inventory editor can move and equip character inventory and owner/GM game commands can grant/remove items, but split/assign workflows, party-pool ownership semantics, and item history UI remain Phase 2 work.
- [ ] PDF character sheet export
- [ ] Party + NPC companions (roster, outfitting, DM-run or player-run) — [familiar/animal-companion creation](src/modules/characters/server/companionCreationRoutes.ts), character rosters, and runtime actor control exist. Full companion outfitting and NPC party-management workflows remain unfinished.

## Phase 3 — Maps & atmosphere

- [ ] World map with travel + exploration
- [ ] Isometric 2.5D tactical map: elevation, multi-level, props, traps, fog, tokens
- [ ] Traps, hazards, location builder
- [ ] Bestiary + encounter builder — monster data, [runtime monster actors](src/modules/game/server/actorRoutes.ts), and encounter start/turn/finish services exist. A searchable bestiary and encounter-composition UI remain unfinished.
- [ ] Sound and music
- [ ] House rules engine — the wizard persists house-rule text and policy settings; arbitrary house rules are not translated into validated executable mechanics.

## Phase 4 — Multiplayer & monetization

- [ ] Invites, membership, realtime sessions
  - [x] [Campaign membership schema](src/infrastructure/database/schema/campaignMembership.ts), role/access checks, and session persistence.
  - [x] [Campaign WebSocket/presence service](src/modules/game/live/CampaignRoom.ts), authenticated live endpoints, and committed-event broadcasts.
  - [ ] Invite creation/acceptance, membership-management UI, and a complete multiplayer onboarding/play flow.
- [ ] Subscription paywall for multiplayer (Stripe checkout, subscriptions table, webhook, billing portal, admin subscriptions view) — Stripe packages are installed, but these billing flows and subscription schema are absent.
- [ ] Gift codes + admin console
  - [x] [Admin console](src/modules/admin/ui/AdminPage.tsx) with server-protected account administration, metrics, and feedback management.
  - [ ] Gift-code storage, issuance, redemption, and entitlement integration.

## Phase 5 — Advanced systems

- [ ] Prestige classes + psionics
  - [x] Prestige-class content/schema is seeded for later advancement, while prestige classes are intentionally excluded from level-one character creation.
  - [x] Psionic character choices, power catalogs, power-point/focus mechanics, and [persistent manifestation services](src/modules/game/server/resolvedCastingService.ts) for supported effects.
  - [ ] Playable advancement into prestige classes and remaining class/power-specific mechanics. Catalog entries do not establish complete class or power support.
- [ ] Epic levels 21+ and expanded sourcebooks
  - [x] [Expanded sourcebook seeds](seeds/dnd3-5/), including Epic Level Handbook content, and an epic campaign-scale setting.
  - [ ] Complete playable epic advancement and runtime coverage for the selected sourcebooks; choosing the epic scale does not provide an epic character progression flow.
- [ ] Crafting, alchemy, enchanting, rituals — some supporting rules/item data exist; executable crafting and resource-management workflows are absent.
- [ ] Leadership, cohorts, followers — leadership rules are seeded; recruitment and persistent cohort/follower management are absent.
- [ ] Factions, armies, mass combat, strongholds — campaign-style options and sourcebook data exist; playable management/resolution systems are absent.

## Audit validation

The September 15 source audit includes the merged offline-first synchronization work,
single-roll/duplicate-check protections, current-turn campaign progression anchoring,
and player-authoritative Initiative flow. The previous September 14 focused audit ran
12 unit-test files covering authentication/schema, dice, D&D rules and derived stats,
character creation rules, campaign options/start, game commands, live coordination,
and book-rule seeds: **112 tests passed** at that point. The newer features add focused
unit coverage for offline sync, DM action history, Initiative resolution, repeated-check
suppression, and turn orchestration. This environment did not independently execute
the full repository test suite; current GitHub Actions jobs have also been failing very
early in the runner/workflow path rather than providing reliable application-test
results. Browser E2E, live Google/AI calls, and remote D1 migrations were not run as
part of this roadmap update. Migrations `0026` and `0027` remain deployment steps for
the corresponding live database features.
