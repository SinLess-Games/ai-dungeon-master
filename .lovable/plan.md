# D&D 3.5 Solo Play with an AI Dungeon Master

A single-player D&D 3.5 app where an AI runs the adventure, you manage a full rules-accurate character sheet, and the game also supports party/NPC management, tactical maps with miniature-style tokens, sound, crafting, and leadership/army/faction play. Multiple characters, parties, campaigns, and worlds, all saved to your account.

## Core vision

- **Character + rules:** Full 3.5 SRD character builder and live sheet, levels 1–20 plus epic 21+, multiclassing, skills, feats, spells, equipment, encumbrance.
- **Play:** Chat with an AI DM that narrates, plays NPCs, sets DCs, and reacts to your dice. The DM can update HP, XP, loot, conditions, quest state, and scene notes through tools.
- **Tactical play:** A 2D grid map with miniature-style tokens for your character, party, NPCs, and enemies. Move tokens, measure distance, set walls/fog/terrain, and run turn-based combat order.
- **Sound:** Ambient music and sound effects tied to location/combat/exploration, with manual and DM-triggered playback.
- **Systems:** Item crafting, Leadership feat with cohorts/followers, army and faction management so the player can lead forces and shape the world.
- **Freedom:** The AI DM is a rules referee, not a railroad. The player can go anywhere, try anything, and the DM adjudicates using 3.5 mechanics.

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
- All SRD core races and classes, levels 1–20 and epic 21+ with epic BAB/save progression, epic feats, epic skill ranks, and epic spell slots.
- Multiclassing with per-class level tracking, favored class handling, and XP penalty warnings.
- Auto-computed derived stats: BAB, saves, AC breakdown, initiative, grapple, skill totals, carrying capacity, encumbrance, spells per day, bonus spells.
- Manual override on any derived value for homebrew or odd rulings.
- Visual character: generated/portrait image and miniature token chosen from token art or uploaded.
- Live sheet during play: HP current/max/temp/nonlethal, conditions, XP and level-up prompts, inventory/gold, prepared/expended slots, consumables, daily-use items.
- Level-up flow walks each new level's choices and applies them.

## Party and NPC management

- Parties are collections of characters. A campaign has one active party.
- Party members can be player-made characters or DM-controlled companions/henchmen with simplified sheets.
- NPC roster per campaign: name, token, disposition, notes, stat block summary, current HP/conditions.
- Initiative tracker in the tactical view with party and NPC tokens.

## Tactical map

- 2D square-grid battle map (5 ft per square) rendered on HTML canvas.
- Map tools: draw/move tokens, set token size (Medium, Large, Huge, etc.), draw walls/terrain zones, fog-of-war reveal, measure distance/range, snap-to-grid and free placement.
- Miniature-style tokens: round bases with portrait/art, colored rings per faction, HP/condition badges.
- Preloaded map tiles and textures; upload custom background images.
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

## Item crafting

- Crafting UI: pick item type (weapon, armor, wand, potion, scroll, misc), material, caster level, prerequisites, and cost/time.
- Craft checks (Spellcraft, Craft skills) rolled by the player; DM tool applies results.
- Recipe/item database from SRD; custom items allowed.
- Inventory updates automatically on success.

## Leadership, armies, and factions

- Leadership feat fully supported: compute leadership score from level + Cha + modifiers, track cohort and follower count, recruit named NPCs as cohorts.
- Follower army units: create units from followers, assign commanders, track morale, equipment, and casualties.
- Factions: major organizations with relationship scores, territories, resources, quests. Player actions shift standings.
- Mass combat mini-system (3.5 War rules adapted): resolve army clashes with morale checks and unit stats, narrated by the DM.
- Domain/stronghold management: holdings generate income/events and can be upgraded.

## World and campaign model

- A "world" is the top-level container for regions, factions, and history.
- A "campaign" is a running adventure inside a world with its own party, map state, log, and quest list.
- Worlds can have multiple campaigns over time.

## Data and rules

- SRD 3.5 rules data (races, classes including epic progressions, skills, feats, spells, equipment, monsters, items) shipped as typed modules.
- Pure rules engine computes every derived value deterministically from the stored build.
- Bestiary and item/monster references available to the DM for quick spawns.

## Technical notes

- Backend on Lovable Cloud: auth plus tables for `profiles`, `characters`, `parties`, `party_members`, `campaigns`, `campaign_messages`, `campaign_state`, `dice_rolls`, `npcs`, `factions`, `army_units`, `worlds`, `crafting_jobs`, and `maps`, all scoped to the owning user with row-level security.
- AI DM runs through Lovable AI on a streaming server route; system prompt carries 3.5 DM guidance plus current snapshots of character/party/scene/faction/army state. It calls tools to mutate persistent state.
- Tactical map: HTML canvas with state synced through server functions; no real-time multiplayer needed.
- Audio: Web Audio API and HTML audio elements with preloaded asset packs.
- Rules engine and SRD data live in the app as typed modules, not in the database.

## Routes

- `/` dashboard
- `/auth`
- `/characters/new` and `/characters/:id` (creator and sheet)
- `/parties` and `/parties/:id`
- `/worlds/:worldId/campaigns/:campaignId` (main play screen: chat + tactical map + dice + sheet panels)
- `/worlds/:worldId/factions`
- `/worlds/:worldId/armies`
- `/worlds/:worldId/npcs`
- `/crafting`

## Build order

**Phase 1 — Playable core**
1. Cloud setup, auth, dashboard shell, basic schema.
2. Rules engine + SRD data (core 1–20).
3. Character creator and sheet.
4. Streaming AI DM chat with simple state tools (HP/XP/loot/journal).
5. Dice roller with animation.

**Phase 2 — Tactical and social layers**
6. Party and NPC management.
7. 2D tactical grid map with tokens, fog, initiative tracker.
8. Sound and music.

**Phase 3 — Advanced systems**
9. Epic levels and expanded SRD data.
10. Item crafting.
11. Leadership feat, cohorts, followers.
12. Factions, armies, mass combat, strongholds.
