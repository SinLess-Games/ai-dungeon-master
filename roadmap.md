# Roadmap — D&D 3.5 AI Dungeon Master

> Status audit refreshed September 14–15, 2026 against the current repository. A checked item means the feature is implemented in the codebase, not that every related sourcebook rule, browser flow, remote migration, provider call, or production deployment has been exhaustively verified.

## Phase 1 — Core playable loop

- [x] Authentication and user accounts
  - [x] Better Auth email/password + Google OAuth, user/admin roles, schema, session handling.
  - [ ] Offline-first saves and cloud synchronization, including maps. Current game persistence uses server-side D1.
- [x] Design system (dark arcane theme, fonts) — [theme tokens and typography](src/styles/styles.css), shared primitives, and feature styling are implemented.
- [x] Rules data: races, base classes, skills, feats, alignments — [D&D content seeds](seeds/dnd3-5/) and [alignment definitions](src/infrastructure/database/schema/dnd35/primitives.ts) exist. This checks off the core data catalog, not every sourcebook mechanic or deployment of those seeds.
- [x] Rules engine: derived stats, encumbrance (toggleable)
  - [x] Deterministic [derived character stats](src/rulesets/dnd35/derivedCharacter.ts) and [carrying capacity/load classification](src/rulesets/dnd35/encumbrance.ts).
  - [x] Live `encumbranceEnabled` toggle, carried-weight classification, movement/run/Max-Dex/armor-check restrictions, and authoritative skill-check/target-AC integration. Armor and load restrictions use the worse applicable restriction rather than stacking the same restriction twice; equipped armor movement is reflected in the live sheet even when carried-load penalties are disabled.
- [x] Dice roller with large-roll support (100d6+) — [dice page/tray](src/modules/dice/ui/), shared saved history, and [notation engine](src/engine/diceNotation.ts) support up to 1,000 dice per expression.
- [ ] Local save layer (swap to Cloud when available) — device-local dice history exists, but character/campaign/world saves require the server; there is no offline game-save adapter or reconciliation flow.
- [x] Dashboard — implemented as the [campaign management hub](src/modules/campaigns/ui/CampaignsHub.tsx) and [character library](src/modules/characters/ui/CharacterLibrary.tsx), with saved records, campaign setup, start/resume, and deletion. There is no separate unified `/dashboard` page.
- [x] Character creator with inline explanations — [multi-step creator](src/modules/characters/ui/AdvancedCharacterCreator.tsx), persisted selections, explanatory content, and server readiness/finalization are implemented for supported starting characters. Later-level advancement remains separate work.
- [x] Character sheet (live, editable) — campaign play now exposes an authoritative live D&D 3.5 sheet with abilities, combat stats, HP, saves, skills, feats, classes, XP, alignment, editable identity/notes, an encumbrance toggle, and ongoing carried/stored/party inventory and equipment-slot editing. Inventory placement changes use the shared game-command boundary and emit auditable game events; owner/GM catalog grants and removals remain audited commands as well. Equipment slot validation includes exclusive hand and left/right ring handling.
- [x] Campaign setup wizard (style, type, length, pace, DM temperament, world notes, house rules)
  - [x] [Persistent seven-stage wizard](src/modules/campaigns/ui/CampaignCreator.tsx): style, structure, scale, pace, world profile, descriptions, rules, player permissions, DM behavior, and house-rule notes.
  - [x] [Campaign length/duration](docs/campaign-duration.md): short/medium/long/endless, optional session/level/ending targets, draft persistence/editing, and explicit AI DM pacing context. Targets guide narration without forcing mechanical outcomes.
- [x] AI DM persistent conversations and generated replies
  - [x] Persisted in-character and OOC message history with AI responses.
  - [x] Validated game commands for encounters, attacks, checks, casting, and psionics.
  - [x] First structured AI DM tool loop for skill checks and saving throws.
  - [ ] Token streaming.
  - [ ] Expand model tools to attacks, casting, conditions, and other state mutations.
  - [ ] Item/XP grant workflows through AI tools.
  - [ ] Alignment tracking through AI/world events.
- [ ] World builder and interactive world map — campaign start currently creates a minimal world root, not full generated regions, settlements, roads, NPC populations, or a browsable map.

## Phase 2 — Reference, loot, export

- [ ] Rules wiki with search + filters — rules/content catalogs and creator search exist; a standalone wiki route and browsing UI do not.
- [ ] Loot tracking (on-person / stored / party) — the Phase 1 live inventory editor can move and equip character inventory and owner/GM game commands can grant/remove items, but split/assign workflows, party-pool ownership semantics, and item history UI remain Phase 2 work.
- [ ] PDF character sheet export
- [ ] Party + NPC companions (roster, outfitting, DM-run or player-run) — [familiar/animal-companion creation](src/modules/characters/server/companionCreationRoutes.ts), character rosters, and runtime actor control exist. Full companion outfitting and NPC party-management workflows remain unfinished.

## Phase 3 — Tactical play

- [ ] 2.5D tactical battle map
- [ ] Position/terrain-aware combat
- [ ] Hazards, cover, concealment, line of sight, reach, and movement
- [ ] Bestiary/monster encounter UI
- [ ] Audio/ambient system

## Phase 4 — Advanced campaign systems

- [ ] Executable house-rule system
- [ ] Full multiplayer invite/join/party workflow
- [ ] Stripe subscriptions/billing
- [ ] Gift codes
- [ ] Advanced crafting
- [ ] Leadership/follower/faction systems
- [ ] Rich world generation with persistent settlements, roads, factions, NPCs, and maps

## Validation notes

Reviewed current routes, feature modules, schemas, seeds, and test coverage; excluded legacy code. Ran 12 focused unit-test files covering authentication/schema, dice, D&D rules and derived stats, character creation rules, campaign options/start, game commands, live coordination, and book-rule seeds: **112 tests passed** at the September 14 audit point. Later AI-DM, campaign-duration, and live-sheet/encumbrance work adds focused unit coverage, but this environment cannot execute the repository test suite and current GitHub Actions jobs fail before their workflow steps begin. Browser E2E, live Google/AI calls, remote migrations, and deployment were not run for this roadmap audit.
