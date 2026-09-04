# D&D 3.5 with an AI Dungeon Master

A D&D 3.0/3.5 app where an AI runs the adventure, you manage a full rules-accurate character sheet, and you can invite friends to play in the same party. Solo play is free; multiplayer is a paid upgrade, unlockable with gift codes.

## Core vision

- **Character + rules:** Full builder and live sheet — every base class and prestige class, levels 1–20 plus epic 21+, psionics, multiclassing, skills, feats, spells, equipment, alchemy.
- **Play:** Chat with an AI DM that narrates, plays NPCs, sets DCs, and reacts to your dice. It can grant rewards and change your alignment based on how you actually play.
- **Multiplayer:** Invite friends by link or email. Everyone shares one campaign, one map, one chat, one initiative order.
- **Tactical play:** 2.5D isometric grid maps with elevation, multi-level dungeons, traps, and miniature-style tokens.
- **World:** Full world map with regions, settlements, dungeons, and factions.
- **Systems:** Crafting, enchanting, ritual magic, alchemy, loot tracking, Leadership, armies, and factions.
- **Reference:** Built-in searchable rules wiki and house rules the DM follows.
- **Export:** Print-ready PDF character sheets.
- **Freedom:** The DM is a referee, not a railroad. Go anywhere, try anything.

## Accounts, saves, and game state

- Email + password login, cloud saves across devices.
- Dashboard: characters, parties, campaigns, worlds.
- **Consistent game state:** every save is a complete snapshot of the campaign — characters, party, NPCs with their current state, maps and map edits, revealed fog, traps sprung, loot, quests, factions, armies, world changes, and the full chat log. Loading a save restores everything exactly, and the DM's context is rebuilt from that same state so it never "forgets" what happened.
- Autosave on every state change, plus named manual saves and a restore-to-point option.

## Character creator and sheet

- Step-by-step builder with **inline explanations at every step** — what an ability score does, what a class is good at, what a feat means in play, what a skill is used for, with plain-language tooltips and "what should I pick?" guidance for new players.
- Ability scores: point buy, standard array, or rolled with the in-app dice roller.
- **Every base class and prestige class**, with prerequisite checking (BAB, ranks, feats, alignment, casting/manifesting level, special requirements). Unqualified prestige classes show what's missing; house rules can override.
- **Psionics:** full psionic classes, powers, power points, psionic feats, and psionic combat.
- **Epic levels 21+:** epic BAB/save progression, epic feats, epic skill ranks, epic spellcasting and epic psionics, epic prestige progressions.
- Multiclassing with per-class tracking, favored class, and XP penalty warnings.
- Auto-computed derived stats: BAB, saves, AC breakdown, initiative, grapple, skill totals, carrying capacity, spells/powers per day.
- **Encumbrance toggle:** turn encumbrance tracking on or off per campaign or per character.
- Manual override on any derived value.
- Visual character: portrait image and miniature token, chosen from art or uploaded.
- Live sheet in play: HP current/max/temp/nonlethal, conditions, XP, level-up prompts, gold, prepared/expended slots, consumables.
- Level-up flow walks each new level's choices, explains them, and applies them.
- **PDF export:** print-ready classic-layout sheet — core stats/combat/skills, feats/abilities/equipment, spells/powers, plus an epic page for 21+ characters.

## DM-granted advancement and alignment

- The DM can award, mid-play and based on how you actually played: bonus feats, extra skill points, ability score increases, and story-based special abilities — always with a stated in-fiction reason logged to the character's history.
- Roleplay-driven XP bonuses for clever play, good roleplaying, and goals achieved.
- **Alignment drift:** the DM tracks your actions and can shift your alignment when your behavior consistently contradicts it, with a warning first and consequences for class features that require an alignment (paladin, monk, cleric domains).
- All DM grants appear in an approval log so you can see exactly what changed and why.

## Multiplayer: invite other players

- Each campaign has an invite link, email invite, and join code.
- Roles: host (campaign owner) and players. The host controls settings, house rules, and map edit rights.
- Shared live session: same DM chat, map, initiative, party status, updating in real time.
- Each player rolls their own dice; rolls post to the shared log with the roller's name.
- Turn control: a player moves only their own token unless the host grants control.
- Presence indicators for who's online.

## Party and NPC companions

- Parties hold characters from you and from invited players, plus NPC party members.
- **NPC party members are played by the DM**, but the player outfits them — assign gear, weapons, spells prepared, and tactics preferences.
- **Or take full control:** switch a campaign to "player controls all party members" and run the whole party yourself.
- Per-NPC toggle so you can control some and let the DM run others.
- NPC roster per campaign: name, token, disposition, notes, stat block, HP/conditions.

## Loot tracking

- **On-person loot:** what each character is carrying right now, feeding encumbrance when it's on.
- **Stored loot:** stashes, strongholds, bank vaults, wagons, and pack animals, each with its own location and contents.
- **Party loot:** the shared pool, with a split/assign tool (equal shares, by need, or manual) that moves items into a character's on-person inventory.
- Full item history: where it came from, who has it, when it moved.
- Gold and treasure tracking per character and for the party.

## Tactical map

- Square-grid battle map (5 ft/square) on HTML canvas in a **2.5D isometric style** — 2D drawing with real elevation, so cliffs, ledges, stairs, balconies, pits, and rooftops read as height.
- Elevation per tile with shading and shadows; tokens sit at tile height with an elevation badge, and flying/climbing tokens set their own altitude.
- Height affects rules: cover and line of sight, high-ground bonus, falling damage, reach, jump/climb DCs.
- Multi-level maps with a level switcher and stairs/ladders/shafts linking levels.
- Tools: move tokens, token sizes Medium–Colossal, paint terrain and elevation, walls/doors/windows, fog of war, distance and spell-template measuring.
- **Traps and hazards:** place traps with type, search/disable DCs, trigger, save, and damage; hidden until found, resolved automatically when triggered. Environmental hazards too.
- **Location builder:** dungeons, caves, cities, towns, villages, keeps, camps, ruins — generated from a prompt or hand-built from tile sets.
- Miniature-style tokens with faction rings and HP/condition badges.

## World map

- Full world/region map view with terrain, borders, roads, and travel routes.
- Pins for settlements, dungeons, lairs, wonders, and faction territories; click a pin to open its detail page or jump into its playable map.
- Party marker with travel: plot a route, get distance and travel time by movement rate and terrain, and let the DM roll random encounters along the way.
- Fog/exploration state: unvisited regions stay unknown until discovered.
- Zoom from world → region → settlement → local tactical map.

## Dice roller

- Persistent dice tray: d4/d6/d8/d10/d12/d20/d100 plus custom dice.
- **Large rolls supported:** 100d6, 500d6, or more — batched roll with per-die results, total, and a summary view so huge rolls stay readable and fast.
- Modifiers, repeated rolls, exploding/reroll options, and 3.5 shortcuts (attack, damage, save, skill check, initiative) prefilled from the active sheet.
- Animated roll showing dice, then total; push results into chat or the tactical log.
- Roll history per campaign.

## AI Dungeon Master

- Streaming chat DM. System prompt: 3.0/3.5 referee, narrates, runs NPCs, sets DCs, calls for rolls, updates state via tools.
- Receives the full current game state: characters, party, NPCs, scene, map, loot, quests, factions, armies, house rules, campaign settings.
- DM tools: update HP/XP/conditions, grant feats/skill points/ability increases, change alignment, add/remove loot, move loot between pools, set scene/location, add journal entry, spawn/update NPC or monster, update map and tokens, trigger traps, add quests, shift faction standing, start/end combat, trigger sound.
- The player rolls; the DM calls for rolls and applies results.

## Sound and music

- Ambient mixer: exploration, combat, town, dungeon, boss, and more.
- SFX for dice, attacks, spells, footsteps, UI.
- Music triggered manually or by DM tool events; per-layer volume and mute.

## Crafting, enchanting, alchemy, and rituals

- **Mundane crafting:** Craft skill items with cost, time, and progress.
- **Alchemy:** alchemical items (acid, alchemist's fire, tanglefoot bags, antitoxin, tindertwigs, and more), Craft (alchemy) checks, ingredient gathering, lab requirements, and a homebrew recipe builder. Failed batches can produce mishaps.
- **Item enchanting:** the full magic item chain — Craft Magic Arms and Armor, Craft Wondrous Item, Craft Wand/Rod/Staff, Scribe Scroll, Brew Potion, Forge Ring — computing market price, XP/GP cost, days required, caster level, and required spells, with missing prerequisites flagged.
- **Epic item creation** with epic feats and costs.
- **Ritual magic:** multi-caster rituals with participants, components, time, place, and a skill/save chain. Bind creatures, open gates, raise the dead, curse a region, empower an army.
- Player rolls the checks; the DM applies results to inventory, gold, and XP.

## Monsters and bestiary

- Monster database with stat blocks, abilities, CR, type/subtype, and treasure.
- Filter by CR, type, terrain, alignment; one-click add to the map as a token.
- Templates and hit-dice advancement with recomputed stats.
- Encounter builder by party level and target difficulty, with XP awards on victory.
- Custom monster creator for homebrew.

## Leadership, armies, and factions

- Leadership feat: leadership score from level + Cha + modifiers, cohort and follower tracking, recruit named NPCs as cohorts.
- Army units from followers with commanders, morale, equipment, and casualties.
- Factions with relationship scores, territories, resources, and quests that shift with your actions.
- Mass combat mini-system for army clashes, narrated by the DM.
- Stronghold/domain management with income, events, and upgrades.

## Rules wiki (in-app reference)

- Searchable reference panel anywhere in the app and as a slide-out during play.
- Covers races, classes, prestige classes, psionics, epic progressions, skills, feats, spells, powers, magic items, equipment, traps, conditions, combat rules, and monsters.
- Search-as-you-type, category browsing, and cross-links between entries.
- Contextual lookup: click any feat/spell/skill/condition on a sheet or in chat to open its entry.
- House rules shown inline on affected entries; the DM can cite entries in chat.

## House rules

- Per-campaign editor: create, enable/disable, describe.
- Structured rules that change app behavior: ability score generation, HP per level, XP multiplier, multiclass XP penalty, flanking and crit variants, **encumbrance on/off**, prestige prerequisite enforcement, epic tweaks, rest/recovery rate, allowed sourcebooks.
- Free-text rules go into the DM's prompt so it plays by your table's rules.

## World and campaign creation

**World builder:** name, themes, geography (regions, terrain, settlements), history/eras, pantheon, planes, notable figures. Settlements get size, government, population, economy, notable locations, and residents. Dungeons and sites attach to regions with their own maps. AI-assisted generation from a one-line description, or build it by hand. Worlds persist and host multiple campaigns; past campaign history carries forward.

**Campaign setup wizard:**
- **Game type:** Westward March, Dungeon Crawl, Death Trap, Epic, Heroes, Defeat the Demon Lord, Apocalypse, or custom — each preset setting pacing, encounter mix, trap frequency, lethality, and XP curve.
- **Style:** heroic, gritty/dark, high magic, low magic, horror, intrigue, military, exploration, sandbox, or a blend.
- **Structure:** story arc, episodic, sandbox, hexcrawl, megadungeon, war, city.
- **Length:** one-shot, short, standard arc, long-running, endless.
- **Pace:** narrative-fast, balanced, or tactical-slow.
- **Difficulty and lethality**, **level range** (start, target, epic on/off), tone dials, DM style, house rules, allowed sourcebooks, and a generated or custom opening.
- All settings editable mid-campaign.

## Content and sourcebooks

- Rules content spans 3rd edition and 3.5, including the material in Heroes of Horror, Book of Vile Darkness, Book of Exalted Deeds, the Expanded Psionics Handbook, the Epic Level Handbook, and other supplements — taints, corruption and sanity, vile and exalted feats and spells, psionic classes and powers, epic progressions.
- Reference data is pulled from the open SRD sources you named (d20srd.org and srd.dndtools.org), which cover the openly licensed portions of these books. Content from those books that is not openly licensed will not be reproduced verbatim — it's represented mechanically or as original summaries, with a homebrew editor to add anything missing.
- Per-campaign source toggles let you allow or exclude any book's content.

## Pricing, gift codes, and admin

- **Free tier:** unlimited solo play — characters, worlds, campaigns, maps, and the AI DM for a single player.
- **Paid tier:** multiplayer — inviting other players to a campaign, shared realtime sessions, and party seats. Subscription, with the host's plan covering the table.
- Upgrade prompts appear only when a free user tries to invite someone; nothing in solo play is gated.
- **Gift codes:** redeem a code on your account page to unlock multiplayer or other entitlements, either for a period or permanently.
- **Admin console** (site admin only): create gift tokens with configurable permissions — what they unlock, how long they last, how many uses, expiry date, and optional restriction to a specific email. View, revoke, and audit redemption history.
- Admin role is stored in a dedicated roles table and checked server-side, never client-side.

## Technical notes

- Backend on Lovable Cloud: auth plus tables for profiles, user roles, worlds, regions, settlements, sites, characters, parties, party members, campaigns, campaign players, invites, messages, campaign state snapshots, house rules, dice rolls, NPCs, custom monsters, loot containers and items, factions, army units, crafting/alchemy jobs, rituals, maps, map levels, map tokens, traps, subscriptions, and gift codes/redemptions — all under row-level security scoped to the owner and accepted campaign members.
- Multiplayer uses realtime subscriptions on messages, tokens, initiative, and rolls. Invites are accept-by-code with membership rows granting access under RLS.
- AI DM runs through Lovable AI on a streaming server route with tool calling for every state mutation.
- Maps render on HTML canvas in isometric projection with per-tile elevation and multi-level stacks.
- Large dice rolls are computed in a single batched pass with summarized display, so 500d6 stays instant.
- PDF export is generated client-side from the computed sheet.
- Rules data ships as typed modules in the app, shared by the engine and the wiki. Sourcebook content is imported from the open SRD sites into that dataset ahead of time, not fetched live during play.
- Payments and entitlement checks are server-side; gift code redemption is a server function that validates and grants entitlements atomically.

## Routes

- `/`, `/auth`, `/account` (subscription, gift code redemption)
- `/characters/new`, `/characters/:id`
- `/parties`, `/parties/:id`
- `/join/:inviteCode`
- `/worlds/new`, `/worlds/:worldId` (world map and overview)
- `/worlds/:worldId/campaigns/new`, `/worlds/:worldId/campaigns/:campaignId` (play screen), `/settings`
- `/worlds/:worldId/maps/:mapId` (map editor)
- `/worlds/:worldId/factions`, `/armies`, `/npcs`, `/settlements`
- `/loot`, `/crafting`, `/bestiary`
- `/wiki`, `/wiki/:category/:slug`
- `/admin/gift-codes` (site admin only)

## Build order

**Phase 1 — Playable solo core**
1. Cloud setup, auth, roles, dashboard, schema, save/game-state model.
2. Rules engine + SRD data import (races, base classes, skills, feats, spells, 1–20).
3. Character creator with inline explanations, and the live sheet.
4. World builder and campaign setup wizard.
5. Streaming AI DM with state tools, including grants and alignment tracking.
6. Dice roller with large-roll support.

**Phase 2 — Reference, loot, and export**
7. Rules wiki with search and contextual lookup.
8. Loot tracking (on-person, stored, party).
9. PDF character sheet export.
10. Party and NPC companions, with outfit/control modes.

**Phase 3 — Maps and atmosphere**
11. World map with travel and exploration.
12. Isometric 2.5D tactical maps with elevation and multi-level dungeons.
13. Traps, hazards, and the location builder.
14. Bestiary and encounter builder.
15. Sound and music.
16. House rules engine wired through creation, engine, and DM prompt.

**Phase 4 — Multiplayer and monetization**
17. Invites, campaign membership, realtime shared sessions.
18. Subscription paywall for multiplayer.
19. Gift codes and the admin token console.

**Phase 5 — Advanced systems**
20. Prestige classes and psionics.
21. Epic levels 21+ and expanded sourcebook content.
22. Crafting, alchemy, enchanting, and rituals.
23. Leadership, cohorts, followers.
24. Factions, armies, mass combat, strongholds.
