# AI Dungeon Master

**AI Dungeon Master** is a Dungeons & Dragons 3.0/3.5-inspired virtual tabletop where an AI acts as the Dungeon Master, tracks campaign state, runs NPCs and monsters, interprets player actions, and helps enforce the rules.

The goal is to recreate the freedom of a tabletop campaign without requiring a human DM.

Players can build rules-accurate characters, explore persistent worlds, fight tactical encounters, manage equipment and companions, and eventually invite friends into shared campaigns.

> **Primary design principle:** the AI Dungeon Master is a referee and storyteller, not a railroad. Players should be able to attempt anything their characters could reasonably attempt.

## Current Goal

The first milestone is a **fully playable single-player D&D 3.5 experience** built around three systems:

1. A complete character creator and live character sheet.
2. A persistent campaign state.
3. An AI Dungeon Master capable of running the adventure.

Everything else builds on that foundation.

## Core Experience

### AI Dungeon Master Responsibilities

The AI DM acts as the campaign's narrator, referee, NPC controller, encounter manager, and world simulator.

The DM should be able to:

- Narrate scenes and environments.
- Roleplay NPCs.
- Control monsters and NPC companions.
- Interpret free-form player actions.
- Request dice rolls when necessary.
- Determine appropriate DCs.
- Resolve skill checks.
- Start and manage combat.
- Track initiative.
- Apply damage and healing.
- Apply conditions.
- Award XP.
- Give treasure.
- Create quests.
- Advance world events.
- Track faction relationships.
- Change NPC attitudes.
- Modify alignment based on player behavior.
- Grant story-based abilities, feats, or bonuses.
- Remember previous decisions and consequences.

The player rolls dice.

The AI determines **what needs to be rolled and what happens afterward**.

All changes made by the DM should be performed through structured game-state tools rather than hidden inside chat responses.

## Character System

### Character Creator

The character creator should support both experienced players and people who have never played D&D 3.5.

Every step should include:

- Plain-language explanations.
- Rules references.
- Prerequisite warnings.
- Recommendations for new players.
- "What does this do?" tooltips.
- "Why would I choose this?" guidance.

Character creation includes:

- Race.
- Ability scores.
- Alignment.
- Background information.
- Class.
- Skills.
- Feats.
- Equipment.
- Spells.
- Psionics.
- Character portrait.
- Miniature/token.

Ability generation should support:

- Point buy.
- Standard array.
- Dice rolls.

### Classes

The long-term goal is to support:

- Every base class.
- Prestige classes.
- Multiclassing.
- Psionic classes.
- Epic progression.
- Levels beyond 20.

Prestige-class requirements should be validated automatically, including:

- Base Attack Bonus.
- Skill ranks.
- Required feats.
- Alignment.
- Spellcasting level.
- Manifesting level.
- Special prerequisites.

Players should still be able to override requirements when campaign house rules allow it.

## Live Character Sheet

The character sheet should automatically calculate derived statistics while still allowing manual overrides.

Tracked information includes:

### Combat

- Armor Class.
- Touch AC.
- Flat-footed AC.
- Base Attack Bonus.
- Attacks.
- Damage.
- Initiative.
- Grapple.
- Saving throws.
- Spell resistance.
- Damage reduction.
- Movement speed.

### Health

- Maximum HP.
- Current HP.
- Temporary HP.
- Nonlethal damage.
- Conditions.
- Death and dying state.

### Character Progression

- XP.
- Character level.
- Individual class levels.
- Level-up notifications.
- Feats.
- Class abilities.
- Ability score increases.
- Skill ranks.

### Resources

- Gold.
- Equipment.
- Ammunition.
- Consumables.
- Spell slots.
- Prepared spells.
- Power points.
- Psionic powers.

### Carrying Capacity

Encumbrance can be enabled or disabled by the campaign.

When enabled, carried equipment automatically affects:

- Load category.
- Movement.
- Armor restrictions.
- Relevant skill penalties.

## Leveling

When a character gains a level, the app should walk the player through the process.

The level-up flow should explain:

- New class features.
- Skill points.
- Feat selections.
- Ability score increases.
- Spell progression.
- Psionic progression.
- Prestige-class eligibility.

All derived statistics should then be recalculated automatically.

## DM-Granted Advancement

The AI DM may reward exceptional or story-driven behavior with abilities outside normal progression.

Examples include:

- Bonus feats.
- Additional skill points.
- Ability score increases.
- Unique supernatural abilities.
- Reputation bonuses.
- Story-specific powers.

Every DM-granted reward must record:

- What was granted.
- Why it was granted.
- When it happened.
- What event caused it.

These changes should appear in the character's history.

## Alignment

Alignment should react to how the player actually behaves.

The AI DM tracks repeated behavior over time.

If a player's actions consistently contradict their alignment, the DM may begin **alignment drift**.

Before a major alignment shift, the player should normally receive an in-world warning.

Alignment changes can affect rules such as:

- Paladin abilities.
- Cleric restrictions.
- Monk progression.
- Alignment-restricted spells.
- Prestige-class requirements.
- Magic items.

## Dice Roller

A persistent dice tray should support:

- d4.
- d6.
- d8.
- d10.
- d12.
- d20.
- d100.
- Custom dice expressions.

Examples:

```text
1d20+8
2d6+4
8d6
100d6
500d6
```

Large rolls should be processed as batches so hundreds of dice remain fast.

The roller should support shortcuts for:

- Attack rolls.
- Damage.
- Saving throws.
- Skill checks.
- Initiative.

Modifiers should automatically populate from the active character sheet.

Every campaign should maintain a roll history.

## Persistent Campaign State

A campaign must be more than a chat history.

The entire world should be persistent.

A campaign snapshot may contain:

- Player characters.
- NPCs.
- Monsters.
- Party composition.
- HP.
- Conditions.
- Inventory.
- Loot.
- Maps.
- Tokens.
- Fog of war.
- Traps.
- Quests.
- Journals.
- Factions.
- Relationships.
- Settlements.
- Armies.
- Strongholds.
- World events.
- Campaign settings.
- House rules.
- Chat history.

Autosaves should occur whenever important state changes.

Players should also be able to create named manual saves.

Loading a save should restore the campaign exactly as it existed at that point.

The AI Dungeon Master's context should then be reconstructed from this canonical game state so the DM does not rely exclusively on conversation history.

## Campaigns

Campaigns belong to persistent worlds.

A campaign creation wizard should allow the player to configure how the AI Dungeon Master runs the game.

### Game Type

Examples:

- Traditional Adventure.
- West Marches.
- Dungeon Crawl.
- Death Trap.
- Epic Adventure.
- Heroes.
- Defeat the Demon Lord.
- Apocalypse.
- Custom.

### Campaign Style

Examples:

- Heroic.
- Gritty.
- Dark Fantasy.
- High Magic.
- Low Magic.
- Horror.
- Intrigue.
- Military.
- Exploration.
- Sandbox.

Styles can be combined.

### Campaign Structure

- Story arc.
- Episodic.
- Sandbox.
- Hexcrawl.
- Megadungeon.
- War.
- City campaign.
- Custom.

### Campaign Length

- One-shot.
- Short.
- Standard.
- Long-running.
- Endless.

### Additional Settings

- Difficulty.
- Lethality.
- Starting level.
- Target level.
- Epic levels.
- Campaign tone.
- Encounter frequency.
- Trap frequency.
- XP progression.
- Allowed sourcebooks.
- House rules.
- DM personality.
- Opening scenario.

Campaign settings may be modified after the campaign begins.

## Worlds

Worlds persist independently of campaigns.

Multiple campaigns may take place in the same world, allowing history from previous adventures to remain part of the setting.

The world builder should support:

- World name.
- Themes.
- Regions.
- Geography.
- Terrain.
- Settlements.
- Kingdoms.
- Governments.
- History.
- Eras.
- Pantheons.
- Planes.
- Factions.
- Important NPCs.
- Dungeons.
- Ruins.
- Landmarks.

Worlds can be:

- Generated from a prompt.
- Built manually.
- Expanded by the AI during play.

## World Map

The world map should display:

- Regions.
- Terrain.
- Political borders.
- Roads.
- Travel routes.
- Settlements.
- Dungeons.
- Lairs.
- Wonders.
- Faction territory.

The party has a location marker.

Travel should calculate:

- Distance.
- Movement speed.
- Terrain modifiers.
- Expected travel time.

The AI DM may roll for encounters during travel.

Unexplored areas may remain hidden until discovered.

The intended navigation hierarchy is:

```text
World
  ↓
Region
  ↓
Settlement / Dungeon
  ↓
Local Map
  ↓
Tactical Encounter
```

## Tactical Maps

Combat maps use a **2.5D isometric square grid**.

Each square represents 5 feet.

The system should support real elevation without requiring a full 3D engine.

Examples include:

- Cliffs.
- Hills.
- Balconies.
- Rooftops.
- Pits.
- Bridges.
- Stairs.
- Towers.

Elevation should influence rules such as:

- Line of sight.
- Cover.
- Falling.
- Jumping.
- Climbing.
- Reach.
- High ground.

Maps should support multiple floors connected by:

- Stairs.
- Ladders.
- Shafts.
- Portals.

### Map Tools

The map editor should eventually include:

- Token movement.
- Terrain painting.
- Elevation painting.
- Walls.
- Doors.
- Windows.
- Fog of war.
- Distance measurement.
- Spell templates.
- Lighting.
- Environmental effects.

Creature sizes should include:

- Fine.
- Diminutive.
- Tiny.
- Small.
- Medium.
- Large.
- Huge.
- Gargantuan.
- Colossal.

## Traps and Hazards

Maps may contain hidden traps and environmental hazards.

Trap properties may include:

- Trap type.
- Trigger.
- Search DC.
- Disable Device DC.
- Saving throw.
- Damage.
- Effects.
- Reset behavior.

Traps remain hidden until discovered.

When triggered, the AI DM resolves them using normal game rules.

## NPC Companions

NPC party members may be controlled by the AI Dungeon Master.

Players should still be able to manage their companions':

- Equipment.
- Weapons.
- Armor.
- Spells.
- Prepared spells.
- Tactics.

Campaigns may alternatively allow players to control the entire party.

Control should be configurable per NPC.

## Loot

Loot exists in actual locations instead of a single abstract inventory.

### Character Inventory

Items currently carried by a character.

These items affect encumbrance when enabled.

### Party Loot

Shared treasure awaiting distribution.

Players may divide it:

- Equally.
- By need.
- Manually.

### Stored Loot

Items may be stored in:

- Wagons.
- Pack animals.
- Houses.
- Strongholds.
- Vaults.
- Banks.
- Hidden stashes.

Every item should maintain a history of where it came from and who currently possesses it.

## Crafting

### Mundane Crafting

Uses D&D Craft skills with:

- Material cost.
- Craft DC.
- Progress.
- Crafting time.

### Alchemy

Support should eventually include:

- Acid.
- Alchemist's fire.
- Antitoxin.
- Tanglefoot bags.
- Tindertwigs.
- Additional SRD alchemical items.
- Custom recipes.

Alchemy may require:

- Ingredients.
- Laboratories.
- Skill checks.

Failed batches may produce mishaps.

### Magic Item Creation

Support the normal item-creation feats and rules, including:

- Brew Potion.
- Craft Magic Arms and Armor.
- Craft Rod.
- Craft Staff.
- Craft Wand.
- Craft Wondrous Item.
- Forge Ring.
- Scribe Scroll.

The app should calculate:

- Market price.
- GP cost.
- XP cost.
- Crafting time.
- Required spells.
- Required caster level.
- Missing prerequisites.

Epic item creation should eventually be supported.

## Ritual Magic

Rituals may involve multiple participants.

A ritual can define:

- Participants.
- Components.
- Casting time.
- Required location.
- Skill checks.
- Saving throws.
- Consequences.

Examples include:

- Opening planar gates.
- Binding creatures.
- Raising the dead.
- Cursing regions.
- Empowering armies.
- Large-scale magical effects.

## Monsters and Bestiary

The application should include a searchable monster database.

Monster records should contain:

- Stat block.
- Challenge Rating.
- Type.
- Subtype.
- Alignment.
- Abilities.
- Treasure.
- Environment.

The bestiary should support filters for:

- CR.
- Type.
- Environment.
- Alignment.

Monsters can be added directly to encounters.

Future tools should include:

- Monster templates.
- Hit-dice advancement.
- Custom monsters.
- Encounter difficulty calculation.

## Leadership

Support the **Leadership** feat and related systems.

Track:

- Leadership score.
- Cohort.
- Followers.
- Reputation modifiers.
- Follower levels.

Followers may eventually become:

- Soldiers.
- Craftsmen.
- Spellcasters.
- Administrators.
- Army units.

## Armies and Factions

Factions should track:

- Relationship with the party.
- Territory.
- Resources.
- Leadership.
- Military strength.
- Active goals.
- Quests.

Player actions can improve or damage faction relationships.

Army units may contain:

- Unit size.
- Equipment.
- Commander.
- Morale.
- Casualties.

Large conflicts can use a simplified mass-combat system while the AI DM narrates the battle.

## Strongholds and Domains

Characters may eventually control:

- Camps.
- Keeps.
- Castles.
- Towns.
- Cities.
- Kingdoms.

Strongholds can generate:

- Income.
- Resources.
- Events.
- Quests.
- Political consequences.

## Rules Wiki

The application should include a searchable rules reference.

Content categories may include:

- Races.
- Classes.
- Prestige classes.
- Skills.
- Feats.
- Spells.
- Psionic powers.
- Equipment.
- Magic items.
- Conditions.
- Combat rules.
- Traps.
- Monsters.
- Epic rules.

Search should work while playing.

Clicking a rules term on the character sheet or inside DM chat should open its reference entry.

House-rule modifications should be displayed beside the normal rule.

## House Rules

Every campaign may define its own rules.

Structured rules may alter systems such as:

- Ability generation.
- HP per level.
- XP progression.
- Multiclass XP penalties.
- Critical hits.
- Flanking.
- Resting.
- Healing.
- Encumbrance.
- Prestige-class requirements.
- Allowed books.
- Epic progression.

Free-form rules should also be included in the AI Dungeon Master's campaign context.

## Multiplayer

Multiplayer is a future milestone built on top of the single-player campaign architecture.

Campaigns should support:

- Invite links.
- Join codes.
- Email invitations.
- Shared campaign state.
- Shared chat.
- Shared map.
- Shared initiative.
- Shared dice log.
- Presence indicators.

Each player normally controls their own character and token.

The campaign host controls:

- Campaign settings.
- House rules.
- Map editing.
- Player permissions.

## Sound and Music

Future campaigns may include dynamic audio.

Examples:

- Exploration ambience.
- Dungeon ambience.
- Town ambience.
- Combat music.
- Boss music.
- Weather.
- Footsteps.
- Dice sounds.
- Spell effects.

The AI DM may trigger audio events based on what is happening in the game.

## Character Sheet Export

Characters should be exportable as printable PDFs.

The generated sheet should include:

1. Core abilities and combat statistics.
2. Skills.
3. Feats and abilities.
4. Equipment.
5. Spells or psionic powers.
6. Epic information when applicable.

## Rules and Source Material

The application is intended to support mechanics from Dungeons & Dragons 3.0 and 3.5.

Relevant systems include material such as:

- Core 3.5 rules.
- Expanded Psionics.
- Epic progression.
- Taint and corruption systems.
- Exalted and vile mechanics.
- Additional prestige classes.
- Additional feats and spells.

Publicly available Open Game Content and SRD-compatible material may be incorporated into the application's rules dataset.

Copyrighted material that is not available under an appropriate license should **not** be reproduced verbatim.

Instead, the project can use:

- Openly licensed mechanics.
- Original summaries.
- User-provided homebrew.
- Structured mechanical representations where legally appropriate.

## Architecture

The long-term application consists of several major systems.

```text
┌───────────────────────────────┐
│           Web Client          │
│                               │
│ Character Sheet               │
│ Campaign UI                   │
│ Maps                          │
│ Rules Wiki                    │
│ Dice Roller                   │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│        Application API        │
│                               │
│ Rules Engine                  │
│ Campaign Engine               │
│ Character Engine              │
│ Multiplayer                   │
│ Entitlements                  │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌───────────────┐ ┌─────────────────┐
│ Game Database │ │ AI Dungeon      │
│               │ │ Master          │
│ Characters    │ │                 │
│ Campaigns     │ │ Narration       │
│ Worlds        │ │ Rules decisions │
│ Maps          │ │ NPC control     │
│ State         │ │ Tool calls      │
└───────────────┘ └─────────────────┘
```

The **database is the source of truth**.

The AI Dungeon Master does not directly invent permanent state.

Instead:

```text
Player Action
     ↓
AI DM
     ↓
Rules Decision
     ↓
Structured Tool Call
     ↓
Game Engine
     ↓
Database
     ↓
Updated Campaign State
```

This separation is important for keeping campaigns consistent and preventing AI hallucinations from corrupting game state.

## Suggested Data Model

Major entities will eventually include:

```text
users
profiles
user_roles

worlds
regions
settlements
locations

campaigns
campaign_players
campaign_settings
campaign_snapshots

characters
character_classes
character_skills
character_feats
character_spells
character_inventory

parties
party_members

npcs
monsters

messages
dice_rolls
journal_entries
quests

maps
map_levels
map_tiles
map_tokens
traps

loot_containers
items

factions
faction_relationships

armies
army_units

crafting_jobs
alchemy_jobs
rituals

house_rules

subscriptions
entitlements
gift_codes
gift_code_redemptions
```

Access to user and campaign data should be enforced server-side.

## Routes

Planned application routes include:

```text
/
/auth
/account

/characters
/characters/new
/characters/:characterId

/parties
/parties/:partyId

/join/:inviteCode

/worlds
/worlds/new
/worlds/:worldId

/worlds/:worldId/campaigns/new
/worlds/:worldId/campaigns/:campaignId

/worlds/:worldId/maps/:mapId

/worlds/:worldId/factions
/worlds/:worldId/armies
/worlds/:worldId/npcs
/worlds/:worldId/settlements

/loot
/crafting
/bestiary

/wiki
/wiki/:category/:slug

/settings

/admin
/admin/gift-codes
```

## Monetization

The intended model is:

### Free Tier

Unlimited solo play.

Free players can create:

- Characters.
- Worlds.
- Campaigns.
- Maps.
- Solo adventures.

The AI Dungeon Master remains available for solo campaigns.

### Paid Tier

Multiplayer functionality.

The campaign host's subscription covers the table.

Paid features may include:

- Inviting players.
- Shared sessions.
- Multiplayer campaign seats.
- Realtime synchronization.

Solo gameplay should not be artificially restricted to force upgrades.

## Gift Codes

Gift codes can unlock features or subscriptions.

Codes may define:

- Entitlements.
- Duration.
- Number of uses.
- Expiration.
- Optional email restrictions.

An administrator should be able to:

- Generate codes.
- Revoke codes.
- View redemption history.
- Audit usage.

Administrative permissions must always be validated server-side.

## Development Roadmap

### Phase 1 — Playable Solo Core

The goal of Phase 1 is simple:

> **Create a character, start a campaign, and actually play D&D with the AI DM.**

1. Authentication.
2. User profiles.
3. Database schema.
4. Campaign state model.
5. Character rules engine.
6. Core SRD data.
7. Character creator.
8. Live character sheet.
9. Dice roller.
10. World creation.
11. Campaign creation wizard.
12. AI Dungeon Master.
13. Structured DM tools.
14. Autosaving and campaign restoration.

### Phase 2 — Rules and Character Management

1. Rules wiki.
2. Contextual rules lookup.
3. Loot management.
4. NPC companions.
5. Character PDF export.
6. House-rule system.

### Phase 3 — Maps and Encounters

1. World map.
2. Travel system.
3. Tactical map.
4. Elevation.
5. Multi-level maps.
6. Fog of war.
7. Traps.
8. Hazards.
9. Bestiary.
10. Encounter builder.
11. Dynamic sound and music.

### Phase 4 — Multiplayer

1. Campaign invitations.
2. Campaign membership.
3. Realtime chat.
4. Realtime dice rolls.
5. Shared tactical maps.
6. Shared initiative.
7. Player presence.
8. Multiplayer subscriptions.
9. Gift-code system.

### Phase 5 — Advanced D&D Systems

1. Prestige classes.
2. Psionics.
3. Epic levels.
4. Expanded rules content.
5. Crafting.
6. Alchemy.
7. Magic-item creation.
8. Ritual magic.
9. Leadership.
10. Cohorts and followers.
11. Factions.
12. Armies.
13. Mass combat.
14. Strongholds and domains.

## Immediate Development Priority

Do **not** attempt to build every feature simultaneously.

The initial vertical slice should be:

```text
Login
  ↓
Create Character
  ↓
Create Campaign
  ↓
Enter Campaign
  ↓
Talk to AI DM
  ↓
DM Requests Roll
  ↓
Player Rolls
  ↓
DM Resolves Result
  ↓
Character / Campaign State Changes
  ↓
Autosave
```

If that loop is fun and reliable, the rest of the project has a strong foundation.

## Built with Lovable

This project was originally created with [Lovable](https://lovable.dev).

Development can continue using the [Lovable editor](https://lovable.dev/projects/ff5a4290-261c-463e-b4c3-1bed82cf9855).

### Why Lovable?

- **Ship faster** — describe the feature you want and use Lovable to help implement it.
- **Stay synchronized** — changes made through Lovable can be committed to the repository.
- **Keep ownership** — the application remains in your Git repository and can be developed normally outside Lovable.

## Local Development

You will need:

- Node.js 22.13 or newer (Node.js 24 LTS recommended).
- npm.

Using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) is recommended for managing Node.js versions.

Clone the repository:

```bash
git clone https://github.com/SinLess-Games/ai-dungeon-master.git
cd ai-dungeon-master
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

## Cloudflare Workers

The TanStack Start server, API routes, and static assets deploy together as the
`the-endless-codex` Worker. The existing Lovable Vite wrapper builds Nitro's
`cloudflare-module` target; do not add a second Cloudflare or TanStack Vite plugin.
Cloudflare D1 stores application data. Supabase continues to provide authentication
and file storage. Subscription status refreshes every 30 seconds and on window focus.
AI and payment requests still use the existing Lovable gateways and credentials.

### Environment setup

Set these public build variables in `.env.local` (or in Workers Builds):

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_PAYMENTS_CLIENT_TOKEN=your-stripe-publishable-key
```

The payment token is optional if checkout is unused. Public variables are compiled
into the browser bundle; rebuild after changing them. Never put server secrets in
variables prefixed with `VITE_`.

Copy `.dev.vars.example` to `.dev.vars` and supply your server credentials for
local Worker previews. For `npm run dev`, supply the same server variables in
`.env.local` or the shell environment. `.dev.vars` is read by Wrangler, not Vite.

For production, configure the server variables listed in `.dev.vars.example` in
the Worker's **Settings → Variables and Secrets**, or use
`npx wrangler secret put VARIABLE_NAME` after building. At minimum, configure
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
`LOVABLE_API_KEY`. Configure payment keys and webhook secrets for each payment
environment in use. These are runtime bindings, separate from build variables.
Node compatibility exposes runtime bindings to the existing `process.env` reads.
The `DB` binding in `wrangler.toml` connects the Worker to D1 database
`dc744f5a-7c53-4d37-b695-97b2527ef06a`; it needs no database password.

### D1 database setup and existing data

Apply the SQLite schema locally before development:

```bash
npm run db:migrate:local
npm run dev
```

Vite development uses Wrangler's local D1 proxy and the same persisted database as
Worker previews. `npm run build` never applies migrations to the remote database.
Before deploying, authenticate Wrangler and apply the remote schema:

```bash
npx wrangler login
npm run db:migrate:remote
```

The SQLite migration is in `migrations/`. The old `supabase/migrations/` files are
historical PostgreSQL migrations and must not be applied to D1. Server queries
verify Supabase tokens and enforce ownership and admin permissions before accessing
D1. Browser requests never contain SQL or arbitrary database query plans. New users
get a D1 profile on their first authenticated request, using their Supabase Auth
metadata. Supabase Auth user IDs and existing local save formats are preserved.

**Existing cloud data must be imported before switching production traffic.** Stop
writes to the old application during export/import (including payment webhooks),
then export application tables using a Supabase service-role credential:

```bash
# Supply SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY through your environment.
node scripts/export-supabase-data.mjs
# Test the export against a fresh local database first.
npx wrangler d1 execute DB --local --file .data-migration/supabase.sql
# After reviewing the local result, import into the fresh remote database.
npx wrangler d1 execute DB --remote --file .data-migration/supabase.sql
```

The export retains profile IDs, admin roles, subscriptions, JSON game saves, blog
posts, titles, and timestamps. It contains private data and is gitignored. Import
only into a fresh database after schema migration; the script adds a guard against
importing over application records and replaces initial title seeds with exported
titles. Keep the old Supabase tables available until the cutover is verified.
Auth users and Storage objects stay in Supabase and are not exported or deleted.
For a new installation without an export, grant the first administrator a row in
D1's `user_roles` table using their verified Supabase user UUID.

Blog media uploads go through the Worker so D1 admin roles authorize uploads into
Supabase Storage. Map-art uploads keep the existing Supabase folder-ownership
policies. Continue managing Auth and Storage in Supabase; deleting an Auth account
no longer cascades into D1, so account removal must also clean up that user's D1
records. No remote data is migrated by a build or deploy command.

### Preview and deploy

```bash
npm run build
npm run preview
```

Preview runs the built app locally in the Workers runtime. Rebuild after source
changes; use `npm run dev` for Vite hot reload. To validate the upload without
publishing, run `npm run deploy:check`.

```bash
npx wrangler login
npm run deploy
```

Change the Worker name in `wrangler.toml` before deploying if needed. Nitro merges
this source configuration into `.output/server/wrangler.json` and writes
`.wrangler/deploy/config.json` so Wrangler discovers the built entry and assets.
Do not edit or commit those generated files. Always build before running Wrangler.
This follows [Nitro's Workers deployment flow](https://nitro.build/deploy/providers/cloudflare).

For Cloudflare Workers Builds, use `npm ci` to install, `npm run build` as the build
command, and `npx wrangler deploy` as the deploy command. Set the public build
variables there and the server secrets on the Worker.

After deploying, add the new application origin to Supabase's auth redirect URLs
and any existing OAuth provider allowlists. Update the payment webhook destination
to `/api/public/payments/webhook` on the new origin, preserving its existing
environment query parameter and matching signing secret. Existing external cron
callers must also use the new origin; this configuration does not schedule jobs.

## Repository

<https://github.com/SinLess-Games/ai-dungeon-master>

## Project Philosophy

AI Dungeon Master should feel less like playing a scripted video game and more like sitting at a table with an extremely capable Dungeon Master.

The system should provide the structure of D&D 3.5 without taking away the freedom that makes tabletop roleplaying compelling.

The character sheet knows the rules.

The game engine protects the state.

The dice decide uncertainty.

The AI Dungeon Master makes the world react.

**You decide what your character does.**
