# D&D 3.5 Solo Play with an AI Dungeon Master

A single-player app where an AI runs the adventure and you keep a full, rules-accurate 3.5 character sheet beside the story. Multiple characters, multiple campaigns, all saved to your account.

## What you get

**Accounts and saves**
- Email + password login, with cloud saves so your characters and campaigns follow you across devices.
- A home dashboard listing your characters and your campaigns; open, rename, or delete any save.

**Character creator (full crunch, epic levels)**
- Step-by-step builder: ability scores (point buy, standard array, or rolled with the in-app dice roller), race, class, alignment, skills, feats, equipment, and spells.
- All SRD core races and classes, level 1 through 20 and on into epic levels (21+) with epic attack/save progression, epic feats, epic skill ranks, and epic spell slots.
- Full multiclassing with per-class level tracking, favored class handling, and XP penalty warnings.
- Auto-computed derived stats: BAB, saves, AC breakdown (armor/shield/dex/size/natural/deflection/misc), initiative, grapple, skill totals with ranks/ability/synergy/misc, carrying capacity and encumbrance, spells per day and bonus spells.
- Manual override on any derived value, so homebrew and odd rulings never block you.

**Character sheet and tracking**
- Live sheet during play: HP (current/max/temp/nonlethal), conditions, XP and level-up prompts, inventory and gold, prepared/expended spell slots, consumables and daily-use items.
- Level-up flow that walks each new level's choices and applies them to the sheet.

**Dice roller (yours to click)**
- A persistent dice tray: d4/d6/d8/d10/d12/d20/d100, custom counts and modifiers, advantage-style multi-roll, and 3.5 shortcuts (attack, damage, save, skill check, initiative) prefilled from the open sheet.
- Animated roll with individual die faces shown, then the total — you click, you see it roll, and you choose whether to push the result into the chat for the DM.
- Roll history log per campaign.

**AI Dungeon Master**
- Chat-style play, streaming as the DM writes, with your character sheet always visible next to it.
- The DM knows your current sheet and campaign history, narrates scenes, plays NPCs, sets DCs, and asks you to roll — it never rolls for you.
- Campaign log persists to your account; each campaign has its own URL so you can reload straight back into it.
- Tracks scene state: current location, active quests, NPCs met, initiative order and enemy status during combat, and awards XP/loot.

## Technical notes

- Backend on Lovable Cloud: auth plus tables for `profiles`, `characters` (full sheet as structured data + derived snapshot), `campaigns`, `campaign_messages`, `dice_rolls`, and `campaign_state`, each row scoped to the owning user with row-level security.
- SRD 3.5 rules data (races, classes with epic progressions, skills, feats, spells, equipment) ships as typed data modules in the app, with a pure rules engine that computes every derived value from the stored build. This keeps the sheet deterministic and independent of the AI.
- AI DM runs through Lovable AI on a streaming server route; the system prompt carries 3.5 DM guidance, the character snapshot, and recent campaign state. It uses tools to update scene state, HP, XP, and loot — the app applies those changes to the sheet.
- Routes: `/` dashboard, `/auth`, `/characters/new` (creator wizard), `/characters/:id` (sheet), `/campaigns/:id` (play screen with chat + sheet + dice tray).

## Build order

1. Cloud setup: auth, schema, RLS, dashboard shell.
2. Rules engine + SRD data (core 1-20, then epic 21+).
3. Character creator wizard and full sheet view with level-up.
4. Dice roller with animation, shortcuts, and history.
5. AI DM play screen: streaming chat, campaign persistence, state/HP/XP tools, roll-to-chat handoff.
