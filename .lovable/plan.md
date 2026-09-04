# D&D 3.5 with an AI Dungeon Master

A D&D 3.5 app where an AI runs the adventure, you manage a full rules-accurate character sheet, and you can invite friends to play in the same party. Includes party/NPC management, tactical maps with miniature-style tokens, sound, crafting, leadership/army/faction play, house rules, an in-app rules wiki, and PDF character export.

## Core vision

- **Character + rules:** Full 3.5 character builder and live sheet — every base class and prestige class, levels 1–20 plus epic 21+ using the Epic Level Handbook, multiclassing, skills, feats, spells, equipment, encumbrance.
- **Play:** Chat with an AI DM that narrates, plays NPCs, sets DCs, and reacts to your dice. The DM can update HP, XP, loot, conditions, quest state, and scene notes through tools.
- **Multiplayer:** Invite other players to your game by link or email. Everyone shares one campaign, one map, one chat, and one initiative order, with their own character.
- **Tactical play:** A 2D grid map with miniature-style tokens for your party, NPCs, and enemies. Move tokens, measure distance, set walls/fog/terrain, and run turn-based combat order.
- **Sound:** Ambient music and sound effects tied to location/combat/exploration, with manual and DM-triggered playback.
- **Systems:** Item crafting, Leadership feat with cohorts/followers, army and faction management so players can lead forces and shape the world.
- **Reference:** Built-in searchable rules wiki, plus house rules you define that the AI DM actually follows.
- **Export:** Print-ready PDF character sheets.
- **Freedom:** The AI DM is a rules referee, not a railroad. Players can go anywhere, try anything, and the DM adjudicates using 3.5 mechanics.


## Accounts and saves

- Email + password login, cloud saves across devices.
- Dashboard with:
  - Characters (with portrait/miniature tokens)
  - Parties
  - Campaigns
  - Worlds / factions
- Open, rename, duplicate, or delete any save.

## Character creator and sheet

- Step-by-step builder: ability scores (point buy, standard array, or rolled with the in-app dice roller), race, class, alignment, skills, feats, equipment, spells.
- **Every base class and prestige class:** all SRD/core base classes plus the full prestige class list, with prerequisite checking (BAB, skill ranks, feats, alignment, casting level, special requirements). Prestige classes you don't qualify for are shown greyed with the missing requirement listed, and can be force-taken if a house rule allows.
- **Epic Level Handbook support:** levels 21+ with epic BAB/save progression, epic attack/damage bonuses, epic feats, epic skill ranks, epic spell slots and epic spellcasting, epic prestige class progressions, and divine ranks/salient abilities where applicable.
- Multiclassing with per-class level tracking, favored class handling, and XP penalty warnings.
- Auto-computed derived stats: BAB, saves, AC breakdown, initiative, grapple, skill totals, carrying capacity, encumbrance, spells per day, bonus spells.
- Manual override on any derived value for homebrew or odd rulings.
- Visual character: generated/portrait image and miniature token chosen from token art or uploaded.
- Live sheet during play: HP current/max/temp/nonlethal, conditions, XP and level-up prompts, inventory/gold, prepared/expended slots, consumables, daily-use items.
- Level-up flow walks each new level's choices and applies them.
- **PDF export:** print-ready character sheet PDF in a classic 3.5 layout — page 1 core stats/combat/skills, page 2 feats/special abilities/equipment, page 3 spellbook/spells known and prepared, plus an epic-progression page for 21+ characters. Includes portrait and download button from the sheet.

## Multiplayer: invite other players

- Each campaign has an invite link and email invite, with a join code.
- Roles: campaign owner (host) and players. The host controls campaign settings, house rules, and map editing rights.
- Invited players pick or create a character and join the party.
- Shared live session: everyone sees the same DM chat, tactical map, initiative order, and party status, updating in real time.
- Each player rolls their own dice; rolls post to the shared log with who rolled.
- Turn control: the initiative tracker highlights whose turn it is; a player can only move their own token unless the host grants control.
- Presence indicators showing who is online in the session.

## Party and NPC management

- Parties are collections of characters, from you or from invited players. A campaign has one active party.
- Party members can be player-made characters or DM-controlled companions/henchmen with simplified sheets.
- NPC roster per campaign: name, token, disposition, notes, stat block summary, current HP/conditions.
- Initiative tracker in the tactical view with party and NPC tokens.


## Tactical map

- Square-grid battle map (5 ft per square) rendered on HTML canvas in a **2.5D / isometric style**: drawn as a 2D map but with elevation, so cliffs, ledges, stairs, balconies, pits, rooftops, and multi-level dungeons read as real height.
- Elevation per tile with height shading and drop shadows; tokens sit at their tile's height and show an elevation badge. Flying/climbing tokens set their own altitude.
- Height matters in rules: cover and line of sight blocked by higher terrain, high-ground attack bonus, falling damage from ledges, reach and jump/climb DCs by height difference.
- Multi-level maps: dungeon levels stacked with a level switcher, and connectors (stairs, ladders, shafts) linking them.
- Map tools: draw/move tokens, set token size (Medium through Colossal), paint terrain and elevation, place walls/doors/windows, fog-of-war reveal, measure distance and spell range/templates, snap-to-grid and free placement.
- **Traps and hazards:** place traps on tiles with type, search/disable DCs, trigger, save, and damage. Hidden until spotted; the DM can trigger them and the app resolves the roll chain. Environmental hazards too — fire, ice, poison gas, water depth, difficult terrain.
- **Location builder:** dungeons, caves, cities, towns, villages, keeps, wilderness camps, and ruins. Generate a layout from a prompt or build it by hand from tile sets; city/town maps support districts, shops, taverns, temples, and named NPC residents.
- Miniature-style tokens: round bases with portrait/art, colored rings per faction, HP/condition badges.
- Preloaded tile sets and textures; upload custom background images.
- Save map state per scene/combat encounter; load from campaign state.
- Turn order sidebar with current turn highlight, delay/ready actions, end-turn button.


## Dice roller

- Persistent dice tray: d4/d6/d8/d10/d12/d20/d100, custom counts and modifiers, advantage-style multi-roll.
- 3.5 shortcuts: attack, damage, save, skill check, initiative — prefilled from the active sheet.
- Animated roll showing individual dice and total; you click and can push the result into chat or the tactical log.
- Roll history per campaign.

## AI Dungeon Master

- Streaming chat DM. System prompt: 3.5 referee, narrates, runs NPCs, sets DCs, asks for rolls, updates state via tools.
- The DM receives: character snapshots, party roster, campaign log, current map/scene state, faction/army status.
- DM tools: update HP/XP/conditions, add/remove loot, set scene/location, add journal entry, spawn/update NPC, update map token state, add quest, update faction standing, start/end combat, trigger sound event.
- The player controls dice; the DM calls for rolls and applies results.
- Sandbox freedom: the player can declare actions, travel, negotiate, craft, lead armies, etc. The DM adjudicates within 3.5 rules.
- Campaign log persists per campaign; each campaign has its own URL for direct return.

## Sound and music

- Ambient audio mixer: exploration, combat, town, dungeon, boss, etc.
- SFX for dice, attacks, spells, footsteps, UI.
- Music triggered manually or by DM tool events.
- Volume controls and mute per layer.

## Crafting, enchanting, and ritual magic

- **Mundane crafting:** Craft skill items — weapons, armor, gear, alchemy — with cost, time, and progress tracked per silver-piece rules.
- **Item enchanting:** the full magic item creation chain — Craft Magic Arms and Armor, Craft Wondrous Item, Craft Wand/Rod/Staff, Scribe Scroll, Brew Potion, Forge Ring. Pick base item, choose enchantments and abilities, and the app computes market price, XP cost, GP cost, days required, caster level, and required spells, flagging missing prerequisites.
- **Epic item creation** for epic-level characters, with epic crafting feats and epic costs.
- **Ritual magic:** multi-caster rituals and long-form magic — participants, components, time, location requirements, and skill/save chain. Rituals can bind creatures, create planar gates, raise the dead, curse a region, or empower an army; the DM resolves outcomes and side effects from the roll results.
- Craft/Spellcraft checks are rolled by the player; the DM tool applies results and updates inventory, gold, and XP automatically.
- Recipe/item database from 3.0 and 3.5 sources; custom and homebrew items supported.

## Monsters and bestiary

- Full monster database from 3.0/3.5 sources: stat blocks, abilities, special attacks/qualities, CR, type/subtype, and treasure.
- Search and filter by CR, type, terrain, and alignment; add a monster to the map as a token in one click.
- Templates and advancement: apply templates (skeleton, half-dragon, fiendish, etc.) and advance hit dice, with stats recomputed.
- Encounter builder: assemble encounters by party level and target difficulty, with XP awards computed on victory.
- Custom monster creator for homebrew.


## Leadership, armies, and factions

- Leadership feat fully supported: compute leadership score from level + Cha + modifiers, track cohort and follower count, recruit named NPCs as cohorts.
- Follower army units: create units from followers, assign commanders, track morale, equipment, and casualties.
- Factions: major organizations with relationship scores, territories, resources, quests. Player actions shift standings.
- Mass combat mini-system (3.5 War rules adapted): resolve army clashes with morale checks and unit stats, narrated by the DM.
- Domain/stronghold management: holdings generate income/events and can be upgraded.

## Rules wiki (in-app reference)

- Searchable reference panel available anywhere in the app, and as a slide-out during play so you never leave the table.
- Covers races, base classes, prestige classes, epic progressions, skills, feats, spells, magic items, equipment, conditions, combat rules, and monsters.
- Search-as-you-type with filters and category browsing; cross-links between entries (a feat links to its prerequisite feats, a spell links to the classes that get it).
- Contextual lookup: click any feat/spell/skill/condition on a character sheet or in DM chat to open its wiki entry.
- House rules appear inline on affected entries, flagged as house-ruled.
- The AI DM can cite wiki entries in chat, and those citations open the entry.

## House rules

- Per-campaign house rule editor: create, enable/disable, and describe rules.
- Structured rule types that actually change the app: ability score generation method, HP per level (rolled/average/max), XP multiplier, multiclass XP penalty on/off, flanking and critical variants, encumbrance on/off, prestige class prerequisite enforcement, epic progression tweaks, resting/recovery rate.
- Free-text rules for anything not structured — these go into the AI DM's system prompt so it plays by your table's rules.
- House rules apply to the rules engine, character creator validation, and the DM's adjudication.

## World and campaign model

- A "world" is the top-level container for regions, factions, and history.
- A "campaign" is a running adventure inside a world with its own party, map state, log, quest list, invited players, house rules, and campaign settings.
- Worlds can have multiple campaigns over time.

## Campaign creation

When you start a new campaign, a setup wizard lets you pick:

- **Game type (preset adventure archetypes):** Westward March (frontier expansion and travel), Dungeon Crawl, Death Trap (lethal trap-heavy gauntlet), Epic (21+ world-shaking play), Heroes (classic rise from nobody to legend), Defeat the Demon Lord (long arc toward a great evil), Apocalypse (surviving and reversing a world-ending event) — plus custom. Each preset sets default pacing, encounter mix, trap frequency, lethality, XP curve, and DM prompt framing.
- **Style:** heroic, gritty/dark, high magic, low magic, horror, intrigue/political, military, exploration, sandbox, or a custom blend.
- **Structure:** story arc, episodic quests, open sandbox, hexcrawl, megadungeon, war campaign, city campaign.
- **Length:** one-shot, short (3–5 sessions), standard arc, long-running, endless open world.
- **Pace:** narrative-fast, balanced, tactical-slow (more combat grid time), montage travel vs. hour-by-hour detail.
- **Difficulty and lethality:** encounter difficulty curve, trap frequency and deadliness, resurrection availability.
- **Level range:** starting level, target end level, epic continuation on/off.
- **Tone and content dials:** violence, romance, humor, darkness sliders.
- **DM style:** how chatty the DM is, how much it describes vs. asks, how strict it rules.
- **House rules:** applied at creation from the house rule set you choose.
- **Starting setup:** generated opening scene, starting region, and starting hook — or bring your own premise.
- All settings are editable mid-campaign, and every choice feeds the AI DM's prompt and the app's XP/encounter pacing.

## World creation

- World builder: name, themes, geography (regions, terrains, settlements), history/eras, pantheon, planes, and notable figures.
- Settlements: cities, towns, and villages with size, government, population, economy, notable locations (shops, temples, taverns, guilds), and resident NPCs — each can open into a playable map.
- Dungeon and site registry: named dungeons, ruins, and lairs attached to regions, each with its own multi-level map, traps, and inhabitants.
- AI-assisted generation: describe the world in a sentence and the AI drafts regions, settlements, factions, and history you can edit; or build everything manually.
- Regions and locations get pins on a world overview map; clicking one opens its notes, NPCs, factions, and maps.
- Worlds persist and can host new campaigns later — an old campaign's history carries into the next one.
- Start from a blank world or a prebuilt starter world.

## Data and rules

- Rules data from **3rd edition and 3.5 edition** sources (races, base and prestige classes with epic progressions, skills, feats, spells, equipment, magic items, traps, monsters), shipped as typed modules used by both the rules engine and the wiki. 3.5 is the default; 3.0-only content is tagged so a campaign can allow or exclude it.
- Pure rules engine computes every derived value deterministically from the stored build, with house rules applied as modifiers.
- Bestiary, trap tables, and item references available to the DM for quick spawns.

## Technical notes

- Backend on Lovable Cloud: auth plus tables for `profiles`, `worlds`, `characters`, `parties`, `party_members`, `campaigns`, `campaign_players`, `campaign_invites`, `campaign_messages`, `campaign_state`, `house_rules`, `dice_rolls`, `npcs`, `factions`, `army_units`, `crafting_jobs`, and `maps`, with row-level security scoping access to the owner and to accepted campaign members.
- Multiplayer uses realtime subscriptions on campaign messages, map tokens, initiative, and dice rolls so all seated players stay in sync. Invites are accept-by-code/link with membership rows granting read/write access under RLS.
- AI DM runs through Lovable AI on a streaming server route; system prompt carries 3.5 DM guidance, active house rules, and current snapshots of characters/party/scene/faction/army state. It calls tools to mutate persistent state.
- Tactical map: HTML canvas with token state persisted and broadcast in realtime.
- PDF export is generated client-side from the computed sheet into a paginated 3.5-style layout.
- Audio: Web Audio API and HTML audio elements with preloaded asset packs.
- Rules data lives in the app as typed modules, not in the database, so the wiki and engine read the same source.

## Routes

- `/` dashboard
- `/auth`
- `/characters/new` and `/characters/:id` (creator and sheet, with PDF export)
- `/parties` and `/parties/:id`
- `/join/:inviteCode` (accept an invite)
- `/worlds/new` (world builder)
- `/worlds/:worldId/campaigns/new` (campaign setup wizard)
- `/worlds/:worldId/campaigns/:campaignId` (main play screen: chat + tactical map + dice + sheet + wiki panels)
- `/worlds/:worldId/campaigns/:campaignId/settings` (players, invites, campaign settings, house rules)
- `/worlds/:worldId/factions`, `/armies`, `/npcs`
- `/crafting`
- `/wiki` and `/wiki/:category/:slug`

## Build order

**Phase 1 — Playable core**
1. Cloud setup, auth, dashboard shell, schema.
2. Rules engine + rules data (base classes, races, skills, feats, spells, 1–20).
3. Character creator and sheet.
4. Streaming AI DM chat with state tools (HP/XP/loot/journal), plus world and campaign creation wizards feeding its prompt.
5. Dice roller with animation.

**Phase 2 — Reference, export, and table**
6. Rules wiki with search, browse, and contextual lookup.
7. PDF character sheet export.
8. Party and NPC management.
9. Multiplayer invites, campaign membership, realtime shared session.

**Phase 3 — Tactical and atmosphere**
10. 2D tactical grid map with tokens, fog, initiative tracker.
11. Sound and music.
12. House rule engine wired into creation, rules engine, and DM prompt.

**Phase 4 — Advanced systems**
13. Prestige classes with prerequisite validation.
14. Epic Level Handbook progressions (21+), epic feats and epic spellcasting.
15. Item crafting.
16. Leadership feat, cohorts, followers.
17. Factions, armies, mass combat, strongholds.

11. Leadership feat, cohorts, followers.
12. Factions, armies, mass combat, strongholds.
