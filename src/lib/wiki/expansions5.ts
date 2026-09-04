import type { WikiArticle } from "./dm-guide";

/**
 * Player-facing reference drawn from the skill-focused, arcane, divine and
 * monster-lore supplements. Original summaries of mechanics only.
 */

export const EXPANSION5_CATEGORIES = [
  "Skill & Stealth Options",
  "Arcane Options",
  "Divine Options",
  "Monster Lore",
] as const;

export const EXPANSION5_ARTICLES: WikiArticle[] = [
  /* ------------------------------------------------- skill and stealth --- */
  {
    id: "skill-focused-play",
    title: "Skill-focused characters",
    category: "Skill & Stealth Options",
    summary:
      "How skill ranks unlock options: skill tricks, synergy, taking 10 and 20, aid another, and the classes built around expertise rather than raw combat.",
    tags: ["skills", "scout", "ninja", "spellthief", "tricks"],
    sections: [
      {
        heading: "Skill tricks",
        body: `A **skill trick** is a small, repeatable stunt bought with skill points rather than a feat. Each trick costs 2 skill points, has a minimum rank requirement in its skill, and most can be used once per encounter.

Typical effects: sliding past a foe without provoking, moving your full speed while balancing, tumbling up a wall for a few squares, or pulling a hidden weapon as a free action. You may spend no more than half your character level (rounded up) in skill points on tricks.`,
      },
      {
        heading: "Getting more from ranks",
        body: `- **Synergy** — 5 ranks in a related skill gives +2 on the skill it supports (Tumble helps Balance, Bluff helps Sleight of Hand, and so on).
- **Take 10** — when unhurried and unthreatened, treat the die as a 10.
- **Take 20** — when there is no penalty for failure and time to spare, treat the die as a 20 but spend twenty times as long.
- **Aid another** — beat DC 10 with your own check to give an ally +2.
- **Circumstance bonuses** — the right tools, preparation and an assistant stack where they represent different advantages.`,
      },
      {
        heading: "Classes built on skills",
        body: `- **Scout** — skirmish damage and extra AC when you move at least 10 feet in a round, fast movement, trapfinding and strong wilderness skills. Rewards never standing still.
- **Ninja** — sudden strike damage against flat-footed foes, ki power for brief invisibility and ghost steps, and a monk-like AC bonus without armour.
- **Spellthief** — steals spells, spell resistance and energy resistance from spellcasters by touch, then casts what it took.
- **Swashbuckler-style play** — Intelligence-driven finesse fighting, insightful strike and grace, favouring Dexterity and light armour.`,
      },
      {
        heading: "Stealth and infiltration",
        body: `Hide and Move Silently are opposed by Listen and Spot. You need cover or concealment to hide, and any observer who already sees you must be distracted first (a Bluff check to create a diversion).

Sniping: after attacking from hiding you may hide again at a −20 penalty. Invisibility gives +40 while stationary, +20 while moving. Ranks in Disguise, Forgery, Gather Information and Sense Motive turn an infiltration from a fight into a heist.`,
      },
    ],
  },
  {
    id: "adventuring-gear-and-tools",
    title: "Specialist gear and organisations",
    category: "Skill & Stealth Options",
    summary:
      "Tool kits, alchemical items and affiliation membership: what expertise buys outside of combat.",
    tags: ["equipment", "alchemy", "guilds", "affiliations"],
    sections: [
      {
        heading: "Tools that change the numbers",
        body: `Masterwork tool kits give +2 on their skill. Missing the right kit usually means a −2 improvised penalty, and some tasks (disabling a complex lock, forging a seal) simply cannot be attempted without them.

Common alchemical aids: acid and alchemist's fire as thrown splash weapons, tanglefoot bags to entangle, thunderstones to deafen, smokesticks for instant concealment, sunrods for hands-free light, and antitoxin for a bonus against poison.`,
      },
      {
        heading: "Affiliations",
        body: `Joining a guild, order or temple gives you a rank score based on level, deeds, donations and reputation. Higher rank buys concrete benefits — safehouses, discounted gear, information, loans of magic items, hirelings — and imposes duties, tithes and enemies.

Rank changes over play: you earn it by advancing the group's goals and lose it by embarrassing them.`,
      },
    ],
  },

  /* --------------------------------------------------------- arcane ---- */
  {
    id: "arcane-new-classes",
    title: "Warlock, warmage and wu jen",
    category: "Arcane Options",
    summary:
      "Three arcane classes that work without a spellbook: at-will invocations, a fixed battle-magic list, and elemental mastery with taboos.",
    tags: ["warlock", "warmage", "wu jen", "arcane", "classes"],
    sections: [
      {
        heading: "Warlock",
        body: `Powers are **invocations** — supernatural abilities usable at will, not spells, so they never run out and are not lost to a failed concentration check the way spells are.

Core features: **eldritch blast**, a ranged touch attack whose damage grows with level, shaped and flavoured by invocations (chains that entangle, cones, walls of fire). Invocations come in grades — least, lesser, greater and dark — and you learn only a handful, so each choice matters. You also gain damage reduction that improves with level, the ability to use any magic item as if you could cast from any list, and at-will detection and flight effects. Light armour without arcane failure.`,
      },
      {
        heading: "Warmage",
        body: `A spontaneous caster with a fixed list built almost entirely of direct-damage and battlefield spells. You know every spell on that list, so you never prepare and never guess wrong.

Signature feature: **warmage edge**, adding your Intelligence bonus to the damage of each damaging spell (once per spell, not per missile). Light armour proficiency without arcane failure and a small selection of advanced learning picks that let you add a spell from outside the list.`,
      },
      {
        heading: "Wu jen",
        body: `A prepared arcane caster themed around the five elements — metal, wood, water, fire and earth — who chooses an elemental mastery and gains spell secrets and watchful spirits as it advances.

The trade: every wu jen takes **taboos** as they gain levels (never cutting the hair, never eating meat, never touching iron, and so on). Break a taboo and you lose spellcasting until you atone. Play a wu jen as a character with rules for living, not just spells.`,
      },
    ],
  },
  {
    id: "arcane-options",
    title: "Arcane techniques and gear",
    category: "Arcane Options",
    summary:
      "Reserve feats, metamagic handling, familiars and bonded items, arcane duels and the practical kit of a spellcaster.",
    tags: ["arcane", "metamagic", "reserve feats", "familiar"],
    sections: [
      {
        heading: "Reserve feats",
        body: `A **reserve feat** gives a small at-will magical effect as long as you keep an unused spell of the right school and level available. Hold a fire spell in reserve and you can throw a minor flame all day; cast it and the reserve power switches off until you have another.

They exist so low-level casters are never reduced to a crossbow, and they reward keeping your highest slot open.`,
      },
      {
        heading: "Metamagic in practice",
        body: `Metamagic raises a spell's effective slot level. Prepared casters decide when preparing; spontaneous casters decide when casting and take a full-round action instead of a standard. Feats that reduce a metamagic's cost or let you apply it a few times per day are the main way to make heavy metamagic playable.`,
      },
      {
        heading: "Familiars, bonded items and duels",
        body: `Alternatives to the standard familiar trade the animal for a bonded object, an elemental companion, or an extra feat. Losing a familiar costs experience, so weigh the risk.

Spell duels reward Spellcraft (to identify what is being cast), readied actions to counterspell, and defensive casting via Concentration. Carry a still or silent option, an escape effect, and something that works against creatures immune to your favourite element.`,
      },
    ],
  },

  /* --------------------------------------------------------- divine ---- */
  {
    id: "divine-options",
    title: "Divine magic options",
    category: "Divine Options",
    summary:
      "Domains, turning and rebuking, spontaneous conversion, divine feats and the conduct that keeps your power switched on.",
    tags: ["divine", "cleric", "paladin", "druid", "domains", "turning"],
    sections: [
      {
        heading: "Domains and spontaneous casting",
        body: `A cleric picks two domains from their deity's list; each grants a granted power and one domain spell per spell level that can only fill the domain slot.

Good clerics spontaneously convert any prepared non-domain spell into *cure* spells; evil clerics convert into *inflict* spells. Neutral clerics pick one option and keep it. Druids convert into *summon nature's ally*.`,
      },
      {
        heading: "Turning undead as fuel",
        body: `Turn attempts are 3 + Charisma modifier per day. Beyond driving off undead, they power a whole family of **divine feats** — spending an attempt to add damage, boost speed, empower a weapon, heal, or extend a domain power for a round.

Because attempts are a finite daily resource, Charisma and Extra Turning become real build choices even for characters who rarely fight undead.`,
      },
      {
        heading: "Conduct and consequences",
        body: `Divine casters serve something. Clerics must stay within one alignment step of their deity; paladins must remain lawful good and act with honour; druids must respect the natural order and avoid metal armour.

Breaking faith costs the class's spellcasting and supernatural abilities until an *atonement* restores them. Treat the code as part of the character build, not an afterthought.`,
      },
    ],
  },
  {
    id: "devotion-and-relics",
    title: "Devotion, relics and holy sites",
    category: "Divine Options",
    summary:
      "Devotion feats keyed to domains, relic magic, sacred sites and religious duties any class can take on.",
    tags: ["devotion", "relics", "faith", "pilgrimage"],
    sections: [
      {
        heading: "Devotion feats",
        body: `A **devotion feat** grants a domain-flavoured power usable once per day — a burst of speed, resistance to an energy type, a brief size increase, or a bonus on a class of checks. If you can turn or rebuke undead, spend a turn attempt for extra daily uses.

They are the way a fighter, rogue or wizard can be visibly faithful without taking cleric levels.`,
      },
      {
        heading: "Relics and sacred sites",
        body: `A **relic** is an item whose full power only wakes for a worshipper of the right faith — often requiring a specific spell prepared, an offering, or a minimum standing in the church. To everyone else it is a mundane or minor magic item.

**Sacred sites** grant temporary boons for observing a rite there: a bonus on saves, a free casting, or the restoration of a spent daily power. Pilgrimage becomes a mechanical option, not just background.`,
      },
    ],
  },

  /* ---------------------------------------------------- monster lore ---- */
  {
    id: "monster-lore-basics",
    title: "Knowing what you are fighting",
    category: "Monster Lore",
    summary:
      "Which Knowledge skill identifies which creature, what a successful check tells you, and how to read a monster's stat block as a player.",
    tags: ["monsters", "knowledge", "identify", "tactics"],
    sections: [
      {
        heading: "Knowledge checks by creature type",
        body: `- **Arcana** — constructs, dragons, magical beasts
- **Dungeoneering** — aberrations, oozes
- **Local** — humanoids
- **Nature** — animals, fey, giants, monstrous humanoids, plants, vermin
- **Religion** — undead
- **The Planes** — outsiders, elementals

DC 10 + the creature's Hit Dice identifies it and reveals one useful fact; every 5 points over reveals one more. Untrained characters may only try DC 10 or lower, so someone in the party should keep ranks in at least two of these.`,
      },
      {
        heading: "What to ask about",
        body: `Prioritise, in order: damage reduction and what pierces it, energy immunities and vulnerabilities, spell resistance, special attacks with saves (and which save), speed and flight, and whether it heals or splits.

Most fights are decided by having the right answer in hand — a silvered or cold-iron weapon, an energy your enemy is not immune to, and one save-boosting effect.`,
      },
    ],
  },
  {
    id: "monster-types-and-traits",
    title: "Creature types, subtypes and shared traits",
    category: "Monster Lore",
    summary:
      "What each creature type implies about hit dice, saves, immunities and how your spells and abilities interact with it.",
    tags: ["creature types", "subtypes", "immunities", "traits"],
    sections: [
      {
        heading: "Types at a glance",
        body: `- **Aberration** — alien, often with mind-affecting or grappling attacks
- **Animal** — Intelligence 1–2, immune to most mind-affecting compulsions targeting people, affected by *charm animal*
- **Construct** — no Constitution, immune to mind-affecting, poison, sleep, paralysis, disease, death effects and critical hits; not healed by *cure* spells
- **Dragon** — good saves and hit dice, darkvision, immune to sleep and paralysis
- **Elemental** — no flanking or critical hits, immune to poison, sleep, paralysis and stunning
- **Fey** — low hit dice, high Charisma, enchantment and illusion
- **Giant** — big hit dice, rock throwing and catching
- **Humanoid / Monstrous humanoid** — the baseline; humanoids are the targets of *charm person* and *hold person*
- **Ooze** — blind, mindless, immune to critical hits and flanking
- **Outsider** — proficient with all simple weapons, cannot be raised normally, often has damage reduction pierced by an alignment
- **Plant** — immune to mind-affecting, poison, sleep, paralysis, polymorph and stunning
- **Undead** — no Constitution, immune to mind-affecting, poison, sleep, paralysis, disease, death effects, critical hits and nonlethal damage; harmed by *cure* spells and healed by *inflict*
- **Vermin** — mindless, immune to mind-affecting`,
      },
      {
        heading: "Subtypes that decide fights",
        body: `Alignment subtypes (good, evil, lawful, chaotic) make a creature's natural weapons count as that alignment and make it vulnerable to opposed effects.

Energy subtypes (fire, cold) grant immunity to their own energy and usually vulnerability to the opposite — 50% extra damage. Incorporeal creatures can only be struck by force effects, magic weapons and other incorporeal attacks, and even then half the time. Swarms ignore weapon damage and are beaten with area effects.`,
      },
      {
        heading: "Fighting fiends and aberrant things",
        body: `Fiends typically bring damage reduction pierced by good or silver, resistance to fire and cold, spell resistance, summoning, at-will teleport and darkness, and a tempting bargain. Bring a good-aligned or blessed weapon, a way to beat spell resistance, and *magic circle against evil* to blunt summoning and possession.

Alien horrors lean on mind-affecting attacks, grapples and level or ability damage. Protection from mind control, freedom of movement and restoration effects are worth more than extra damage.`,
      },
    ],
  },
];
