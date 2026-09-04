/**
 * Dungeon Master reference library.
 *
 * These are original summaries of d20/3.5 game procedures and open SRD
 * material (tables of numbers, DCs, XP and treasure guidelines), rewritten in
 * our own words. No text is reproduced from any non-open sourcebook.
 */

export interface WikiSection {
  heading: string;
  body: string;
}

export interface WikiArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  sections: WikiSection[];
}

export const DM_CATEGORIES = [
  "Running the Game",
  "Using the Rules",
  "Adventures",
  "Dungeons & Terrain",
  "Traps & Hazards",
  "Treasure & Rewards",
  "NPCs",
  "Campaigns & Worlds",
  "Planes",
  "Characters & Advancement",
] as const;

export const DM_ARTICLES: WikiArticle[] = [
  {
    id: "dm-what-is-a-dm",
    title: "What a Dungeon Master Does",
    category: "Running the Game",
    summary:
      "The DM's four jobs: describe the world, play everyone in it, adjudicate the rules, and keep the story moving.",
    tags: ["basics", "dm", "role"],
    sections: [
      {
        heading: "The four jobs",
        body:
          "**Narrator.** You describe what the characters see, hear and smell, and you answer questions about the scene truthfully.\n\n**Cast.** Every innkeeper, warlord and owlbear is yours. Give each one a want and a voice.\n\n**Referee.** When the rules are unclear, you decide fast, decide consistently, and move on. Write the ruling down so it stays the same next session.\n\n**Pacemaker.** You control the spotlight. Cut scenes that have run out of decisions, and slow down for the ones the players lean into.",
      },
      {
        heading: "Say yes, then roll",
        body:
          "If a player proposes something plausible and interesting, the answer is rarely \"no.\" Set a DC and let the dice decide. Reserve flat refusals for things that would break the fiction (\"the door is stone, you cannot talk to it\").",
      },
      {
        heading: "Fairness and secrecy",
        body:
          "Roll behind a screen when the players should not know the result (Spot checks against hidden foes, saves against unknown effects). Roll in the open when the tension of a fair fight is the point. Never fudge a roll to punish a player — only, occasionally, to protect a story you all care about.",
      },
    ],
  },
  {
    id: "dm-style-of-play",
    title: "Style of Play",
    category: "Running the Game",
    summary:
      "Dials you set before session one: lethality, realism, tone, rules weight, and the balance of combat, exploration and roleplay.",
    tags: ["tone", "session zero", "style"],
    sections: [
      {
        heading: "The dials",
        body:
          "- **Lethality** — from heroic (death is rare and reversible) to gritty (a bad round kills).\n- **Rules weight** — strict tactical play vs. loose, cinematic adjudication.\n- **Tone** — high fantasy, grim-dark, pulp, horror, comedy.\n- **Focus** — the classic split is roughly a third each of combat, exploration and social play. Shift it to match your table.\n- **Player agency** — sandbox (players choose the next hook) vs. an authored campaign arc.",
      },
      {
        heading: "Agreeing on it out loud",
        body:
          "Run a short session zero. Cover expected tone, content the table wants to avoid, whether PCs may fight each other, how absences are handled, and how many house rules are in play. Written expectations prevent almost every table argument.",
      },
    ],
  },
  {
    id: "dm-running-a-session",
    title: "Running a Session",
    category: "Running the Game",
    summary: "Prep that pays off, opening a session, spotlight management, and ending on the right beat.",
    tags: ["prep", "pacing", "session"],
    sections: [
      {
        heading: "Prep worth doing",
        body:
          "Prepare **situations, not scripts**: a location, the people in it, what they want, and what happens if the party never shows up. Statted encounters, a handful of names, and three rumors will carry a whole night.",
      },
      {
        heading: "Opening",
        body:
          "Recap last session in three sentences (or ask a player to). Restate the party's current goal. Then start in motion — a sound, a visitor, a deadline.",
      },
      {
        heading: "Spotlight",
        body:
          "Track who has spoken. Every 15–20 minutes, hand a scene to whoever has been quiet: a skill their build owns, an NPC from their backstory, a decision only their character can make.",
      },
      {
        heading: "Ending",
        body:
          "End on a turn, a revelation or a threat — not on a shopping trip. Award XP, log treasure, and ask each player for one thing their character wants next time.",
      },
    ],
  },
  {
    id: "dm-adjudication",
    title: "Adjudicating Rules and Setting DCs",
    category: "Using the Rules",
    summary: "How to pick a Difficulty Class on the fly, when to call for a roll at all, and how to handle ties.",
    tags: ["dc", "skills", "rulings"],
    sections: [
      {
        heading: "When to call for a roll",
        body:
          "Roll only when failure is interesting and success is uncertain. If the rogue has all day and no danger, they open the lock. If the wall is climbable and nobody is shooting, they climb it.",
      },
      {
        heading: "DC benchmarks",
        body:
          "| Task | DC |\n| --- | --- |\n| Very easy | 0 |\n| Easy | 5 |\n| Average | 10 |\n| Tough | 15 |\n| Challenging | 20 |\n| Formidable | 25 |\n| Heroic | 30 |\n| Nearly impossible | 40 |\n\nA trained specialist at level 5 reliably beats DC 15; DC 30 should feel like a legend-making moment before roughly level 12.",
      },
      {
        heading: "Modifiers, not new subsystems",
        body:
          "Adjust the situation rather than inventing rules: ±2 for a favorable or unfavorable circumstance, ±5 for a major one. Grant a +2 circumstance bonus for clever preparation — it rewards thinking without warping the math.",
      },
      {
        heading: "Taking 10 and taking 20",
        body:
          "**Take 10** whenever the character is not rushed or threatened. **Take 20** when there is no penalty for failure and time is available (it assumes 20× the normal time). Neither is allowed under stress.",
      },
    ],
  },
  {
    id: "dm-bonus-types",
    title: "Bonus Types and Stacking",
    category: "Using the Rules",
    summary: "Which bonuses stack, which overlap, and the order to apply them.",
    tags: ["bonus", "stacking", "math"],
    sections: [
      {
        heading: "The rule",
        body:
          "Two bonuses of the **same named type** do not stack — only the largest applies. **Dodge bonuses, circumstance bonuses and untyped bonuses do stack.** Penalties always stack unless they share a name.",
      },
      {
        heading: "Common types",
        body:
          "Alchemical, armor, circumstance, competence, deflection, dodge, enhancement, insight, luck, morale, natural armor, profane, racial, resistance, sacred, shield, size.",
      },
      {
        heading: "Order of operations",
        body:
          "Apply ability modifiers first, then size, then the best of each named bonus type, then all stacking bonuses and every penalty. Multipliers apply as addition of extra multiples (×2 and ×2 becomes ×3, not ×4).",
      },
    ],
  },
  {
    id: "dm-three-dimensions",
    title: "Movement, the Grid, and Three Dimensions",
    category: "Using the Rules",
    summary: "Diagonals, elevation, flying, falling, and measuring range in a 2.5D map.",
    tags: ["movement", "grid", "flight", "falling"],
    sections: [
      {
        heading: "Diagonals",
        body:
          "On a square grid the first diagonal costs 5 ft., the second costs 10 ft., and so on alternating. You cannot cut a corner diagonally past a wall.",
      },
      {
        heading: "Vertical distance",
        body:
          "Count height the same way as horizontal squares, alternating 5/10 for the diagonal steps. A creature 20 ft. up and 20 ft. away is about 30 ft. of movement, not 40.",
      },
      {
        heading: "High ground and cover",
        body:
          "Attacking from higher ground grants a +1 bonus on melee attack rolls. Elevation, low walls and intervening creatures typically give +4 AC cover; total cover blocks line of effect entirely.",
      },
      {
        heading: "Falling",
        body:
          "1d6 damage per 10 ft. fallen, maximum 20d6. A successful DC 15 Jump check reduces the effective distance by 10 ft. Falling into water of sufficient depth reduces damage sharply or eliminates it for short falls.",
      },
    ],
  },
  {
    id: "dm-adventure-structure",
    title: "Adventure Structure",
    category: "Adventures",
    summary: "Site-based vs. event-based adventures, hooks, motivation, and building to a climax.",
    tags: ["adventure", "structure", "hooks"],
    sections: [
      {
        heading: "Motivation",
        body:
          "Every adventure needs a reason the *characters* care: coin, duty, revenge, curiosity, survival, or a person they love. Attach at least one hook to a specific PC's backstory.",
      },
      {
        heading: "Site-based",
        body:
          "A place with a map: a dungeon, a keep, a ship, a city block. The players choose the route. Prep the map, the inhabitants, and how those inhabitants react once the alarm goes up.",
      },
      {
        heading: "Event-based",
        body:
          "A plot with a clock: a coronation, a heist, a plague. Prep the villain's plan step by step, then let the players derail it. Note what happens on each day the party does nothing.",
      },
      {
        heading: "The climax",
        body:
          "Aim for one encounter 1–2 EL above the party, with terrain that matters and a stake that is not just hit points. Follow it with a quiet scene so the win lands.",
      },
    ],
  },
  {
    id: "dm-encounter-levels",
    title: "Challenge Ratings and Encounter Levels",
    category: "Adventures",
    summary: "Building fights that are hard but survivable, and how CR combines into EL.",
    tags: ["cr", "el", "encounters", "balance"],
    sections: [
      {
        heading: "The baseline",
        body:
          "An encounter of **EL equal to the party's level** is expected to consume roughly a fifth of the party's resources. Four such encounters make a standard adventuring day.",
      },
      {
        heading: "Combining monsters",
        body:
          "| Monsters of equal CR | Resulting EL |\n| --- | --- |\n| 1 | CR |\n| 2 | CR + 2 |\n| 4 | CR + 4 |\n| 8 | CR + 6 |\n| 16 | CR + 8 |\n\nMonsters more than 4 CR below the party level barely register; monsters 5+ above can end a party outright.",
      },
      {
        heading: "Difficulty dial",
        body:
          "- **EL − 1 or lower:** easy, resource drain only.\n- **EL = party level:** challenging.\n- **EL + 2:** very difficult, expect casualties.\n- **EL + 4:** overwhelming; signal it clearly and allow retreat.",
      },
      {
        heading: "Terrain is a free CR",
        body:
          "Darkness, ledges, water, crowds, burning rafters and a ticking clock change a routine fight more than adding hit points does.",
      },
    ],
  },
  {
    id: "dm-treasure",
    title: "Treasure by Encounter Level",
    category: "Treasure & Rewards",
    summary: "How much loot to hand out, the mix of coin, goods and magic, and expected wealth by level.",
    tags: ["treasure", "loot", "gold", "magic items"],
    sections: [
      {
        heading: "Per-encounter guideline",
        body:
          "| EL | Treasure (gp) |\n| --- | --- |\n| 1 | 300 |\n| 2 | 600 |\n| 3 | 900 |\n| 4 | 1,200 |\n| 5 | 1,600 |\n| 6 | 2,000 |\n| 8 | 3,400 |\n| 10 | 5,800 |\n| 12 | 9,800 |\n| 15 | 22,000 |\n| 20 | 80,000 |\n\nSpread it over several encounters rather than one hoard when the party is low level.",
      },
      {
        heading: "Expected wealth by level",
        body:
          "A character should hold roughly: 900 gp at 2nd, 2,700 at 3rd, 5,400 at 4th, 9,000 at 5th, 23,000 at 7th, 49,000 at 9th, 88,000 at 11th, 150,000 at 13th, 260,000 at 15th, 440,000 at 17th, and 760,000 at 20th. Use this to price a returning character or a rescued NPC.",
      },
      {
        heading: "The mix",
        body:
          "Roughly half coin and gems, a quarter mundane goods worth selling, a quarter magic. Consumables (potions, scrolls, wands) age far better than permanent items — they let you be generous without inflating the party's math.",
      },
      {
        heading: "Non-treasure rewards",
        body:
          "Titles, land, contacts, a favor owed by a duke, a spellbook page, safe harbor in a hostile city. These cost no wealth-by-level budget and are remembered longer.",
      },
    ],
  },
  {
    id: "dm-xp-awards",
    title: "Awarding Experience",
    category: "Treasure & Rewards",
    summary: "XP per encounter, story awards, and pacing advancement.",
    tags: ["xp", "leveling", "advancement"],
    sections: [
      {
        heading: "Per encounter",
        body:
          "Award roughly `(300 × party level) ÷ number of characters` for an encounter of EL equal to the party's level. Each point of EL above the party level multiplies that by about 1.5; each point below divides it by about 1.5.",
      },
      {
        heading: "Pacing",
        body:
          "About 13 encounters at the party's level is a level-up. If you prefer story pacing, level the party after each completed adventure and ignore the arithmetic entirely — the AI DM in this app supports both.",
      },
      {
        heading: "Awards without combat",
        body:
          "A talked-down warlord, a disarmed trap, a heist finished without a sword drawn: award the full EL value. Otherwise you have taught the table that only violence pays.",
      },
    ],
  },
  {
    id: "dm-dungeon-terrain",
    title: "Dungeon Terrain: Walls, Doors and Rooms",
    category: "Dungeons & Terrain",
    summary: "Hardness, hit points and break DCs for the things parties smash, plus room and corridor sizing.",
    tags: ["dungeon", "walls", "doors", "break"],
    sections: [
      {
        heading: "Walls",
        body:
          "| Wall | Typical thickness | Break DC | Climb DC |\n| --- | --- | --- | --- |\n| Masonry | 1 ft. | 35 | 20 |\n| Superior masonry | 1 ft. | 35 | 20 |\n| Reinforced masonry | 1 ft. | 45 | 20 |\n| Hewn stone | 3 ft. | 50 | 22 |\n| Unworked stone | 5 ft. | 65 | 20 |\n| Iron | 3 in. | 30 | 25 |\n| Paper | — | 1 | 30 |\n| Wooden | 6 in. | 20 | 21 |",
      },
      {
        heading: "Doors",
        body:
          "| Door | Hardness | HP | Break DC (stuck / locked) |\n| --- | --- | --- | --- |\n| Simple wooden | 5 | 10 | 13 / 15 |\n| Good wooden | 5 | 15 | 16 / 18 |\n| Strong wooden | 5 | 20 | 23 / 25 |\n| Stone | 8 | 60 | 28 / 28 |\n| Iron | 10 | 60 | 28 / 28 |\n| Portcullis, wooden | 5 | 30 | 25 (lift) |\n| Portcullis, iron | 10 | 60 | 25 (lift) |\n\nLocks run DC 20 (average), 25 (good), 30 (amazing) for Open Lock.",
      },
      {
        heading: "Rooms and corridors",
        body:
          "Corridors of 5 ft. force single file and favor the party; 10 ft. lets two fight abreast; 20 ft. or more lets flankers work. Ceiling height decides whether flight, large creatures and area spells matter. Give at least one room per level a feature worth fighting over: a pit, a chandelier, a pool, a ledge.",
      },
    ],
  },
  {
    id: "dm-light-vision",
    title: "Light, Darkness and Vision",
    category: "Dungeons & Terrain",
    summary: "Illumination radii, concealment from darkness, and how darkvision and low-light vision differ.",
    tags: ["light", "darkvision", "concealment"],
    sections: [
      {
        heading: "Light sources",
        body:
          "| Source | Bright | Shadowy | Duration |\n| --- | --- | --- | --- |\n| Candle | — | 5 ft. | 1 hr |\n| Torch | 20 ft. | 40 ft. | 1 hr |\n| Lantern, hooded | 30 ft. | 60 ft. | 6 hr/pint |\n| Sunrod | 30 ft. | 60 ft. | 6 hr |\n| *Light* spell | 20 ft. | 40 ft. | 10 min/level |\n| *Daylight* | 60 ft. | 120 ft. | 10 min/level |",
      },
      {
        heading: "Seeing in the dark",
        body:
          "**Low-light vision** doubles the radius of any light source. **Darkvision** sees a set distance (usually 60 ft.) in black and white with no light at all, and never works through magical darkness unless stated. Shadowy illumination grants 20% concealment; total darkness grants total concealment (50% miss chance and no Dexterity bonus for the attacker's targets).",
      },
    ],
  },
  {
    id: "dm-traps",
    title: "Designing Traps",
    category: "Traps & Hazards",
    summary: "The five knobs of any trap, how to price its CR, and search/disable DCs.",
    tags: ["traps", "cr", "search", "disable device"],
    sections: [
      {
        heading: "The five knobs",
        body:
          "1. **Trigger** — location, proximity, touch, timed, spell.\n2. **Reset** — none, repair, manual, automatic.\n3. **Attack or save** — an attack bonus, or a save DC and effect.\n4. **Search DC** — how hard it is to spot.\n5. **Disable Device DC** — how hard it is to defeat.\n\nMagic traps have Search and Disable DCs of 25 + spell level, and only a rogue of 4th level or higher may disable them.",
      },
      {
        heading: "CR guidelines",
        body:
          "Start from the average damage or effect severity, then adjust: +1 CR for a Search or Disable DC of 30+, +1 for touch-attack or no-save effects, +1 for area effects, −1 for an obvious, telegraphed trap. A pit that deals 2d6 and can be climbed out of is CR 1; a scything blade with +10 attack for 2d4+6 is around CR 2; a poisoned needle that drains ability score is CR 3–5 depending on the poison.",
      },
      {
        heading: "Traps that are fun",
        body:
          "A trap the party cannot see coming is just damage. Telegraph it — dried blood, scratched flagstones, a corpse pinned to the ceiling — and the room becomes a puzzle instead of a tax.",
      },
    ],
  },
  {
    id: "dm-environmental-hazards",
    title: "Environmental Hazards",
    category: "Traps & Hazards",
    summary: "Heat, cold, suffocation, starvation, falling objects, and other things that kill without rolling initiative.",
    tags: ["hazards", "environment", "survival"],
    sections: [
      {
        heading: "Heat and cold",
        body:
          "Severe heat (over 90°F): Fortitude DC 15 every hour, +1 per previous check, or take 1d4 nonlethal damage. Extreme cold (below 0°F): Fortitude DC 15 every 10 minutes on the same escalating scale. Armor and heavy clothing impose −4 in heat.",
      },
      {
        heading: "Suffocation and drowning",
        body:
          "A character can hold their breath for 2 rounds per point of Constitution while inactive. After that, Constitution check DC 10, +1 each round. On a failure the character drops to 0 hp, then −1 and dying the next round, then dies.",
      },
      {
        heading: "Starvation, thirst and sleep",
        body:
          "Water: one Constitution check per hour past a day without it (DC 10, +1 cumulative), failure deals 1d6 nonlethal. Food: one check per day past three days. Nonlethal damage from deprivation cannot be healed until the need is met.",
      },
      {
        heading: "Falling objects and lava",
        body:
          "A falling object deals 1d6 per 200 lb. per 10 ft. fallen, to a maximum of 20d6. Lava deals 2d6 per round of contact (20d6 if immersed), and damage continues for 1d3 rounds after leaving it.",
      },
    ],
  },
  {
    id: "dm-npc-classes",
    title: "NPC Classes and Ordinary People",
    category: "NPCs",
    summary: "Adept, aristocrat, commoner, expert and warrior — who fills a world and how strong they are.",
    tags: ["npc", "commoner", "expert", "warrior", "adept"],
    sections: [
      {
        heading: "The five NPC classes",
        body:
          "- **Adept** — d6, limited divine casting, the village hedge-priest or shaman.\n- **Aristocrat** — d8, good Will save, broad social skills; nobles and officers.\n- **Commoner** — d4, everything poor; farmers, servants, laborers.\n- **Expert** — d6, ten class skills of your choice; smiths, scribes, spies, physicians.\n- **Warrior** — d8, full BAB, good Fortitude; guards, soldiers, thugs.\n\nAn NPC class level is worth roughly ¾ of a PC class level (CR = level − 1 in most cases).",
      },
      {
        heading: "Populating a settlement",
        body:
          "A typical hamlet is almost all 1st-level commoners with one or two 2nd–3rd level experts and a warrior or two. Community size caps the highest-level resident and the most expensive item purchasable there: thorp ~40 gp limit, village ~200 gp, small town ~800 gp, large town ~3,000 gp, small city ~15,000 gp, metropolis ~100,000 gp.",
      },
    ],
  },
  {
    id: "dm-npc-attitudes",
    title: "NPC Attitudes and Diplomacy",
    category: "NPCs",
    summary: "The five attitude steps and what it takes to shift them.",
    tags: ["diplomacy", "social", "attitude"],
    sections: [
      {
        heading: "The ladder",
        body:
          "**Hostile** (attacks) → **Unfriendly** (acts against you) → **Indifferent** (ignores you) → **Friendly** (helps at low cost) → **Helpful** (takes risks for you).",
      },
      {
        heading: "Diplomacy DCs",
        body:
          "| Starting attitude | To Unfriendly | To Indifferent | To Friendly | To Helpful |\n| --- | --- | --- | --- | --- |\n| Hostile | 20 | 25 | 35 | 50 |\n| Unfriendly | — | 15 | 25 | 40 |\n| Indifferent | — | — | 15 | 30 |\n| Friendly | — | — | — | 20 |\n\nA Diplomacy attempt takes at least a minute of conversation; rushing it is a full-round action at −10.",
      },
      {
        heading: "Making NPCs memorable",
        body:
          "Give each recurring NPC one physical tic, one strong opinion, and one thing they want from the party. That is enough to improvise them consistently for a year.",
      },
    ],
  },
  {
    id: "dm-campaign-building",
    title: "Building and Maintaining a Campaign",
    category: "Campaigns & Worlds",
    summary: "Establishing the premise, keeping continuity, and letting the world react to the party.",
    tags: ["campaign", "continuity", "world"],
    sections: [
      {
        heading: "Establishing",
        body:
          "Answer five questions before session one: where does the party start, why are they together, what threat is stirring, what is the tone, and how far will this go (levels 1–6? 1–20? epic?). Everything else can be improvised.",
      },
      {
        heading: "Maintaining",
        body:
          "Keep a running log of names, debts, promises and consequences. Reincorporate: the bandit who fled in session two returns as a lieutenant in session ten. Continuity, not detail, is what makes a world feel real.",
      },
      {
        heading: "The world reacts",
        body:
          "By 5th level the party is locally famous, by 10th regionally powerful, by 15th a factor in national politics, by 20th a force nations plan around. Change how NPCs greet them accordingly, and give their enemies time to prepare.",
      },
    ],
  },
  {
    id: "dm-world-building",
    title: "World-Building Checklist",
    category: "Campaigns & Worlds",
    summary: "Geography, cultures, faiths, economies and calendars — built only as deep as play requires.",
    tags: ["worldbuilding", "setting", "geography"],
    sections: [
      {
        heading: "Build outward from the table",
        body:
          "Detail the starting town fully, the surrounding region in outline, the kingdom in a paragraph, and the rest of the world in a sentence. Expand only where the players go.",
      },
      {
        heading: "The checklist",
        body:
          "- **Geography** — one map with travel times, not coastlines.\n- **Powers** — three factions with conflicting goals.\n- **Faith** — a handful of gods with domains and taboos.\n- **Magic level** — how common is a healer? a teleport? a resurrection?\n- **Money and law** — who enforces what, and what is contraband.\n- **History** — one catastrophe everyone still talks about.",
      },
      {
        heading: "Magic level changes everything",
        body:
          "If *raise dead* is purchasable, murder is a property crime. If *teleport* is common, borders are meaningless and armies are irrelevant. Decide the availability of the top few spells and the setting largely writes itself.",
      },
    ],
  },
  {
    id: "dm-planes",
    title: "Planes and Planar Traits",
    category: "Planes",
    summary: "The traits that define a plane and what changes for adventurers who travel there.",
    tags: ["planes", "cosmology", "planar"],
    sections: [
      {
        heading: "Planar traits",
        body:
          "- **Physical** — gravity (normal, heavy, light, subjective, none), time flow, shape and size, morphic quality.\n- **Elemental/energy dominance** — fire, water, earth, air, positive, negative.\n- **Alignment** — mildly or strongly good/evil/lawful/chaotic, imposing penalties on visitors of opposed alignment.\n- **Magic** — normal, enhanced, impeded, limited, wild, or dead magic.",
      },
      {
        heading: "The usual cosmology",
        body:
          "A Material Plane, its Ethereal and Shadow reflections, the Astral as the road between everything, four (or more) Inner elemental planes, Positive and Negative energy planes, and a ring of Outer planes sorted by alignment where gods and outsiders live.",
      },
      {
        heading: "Running planar adventures",
        body:
          "Pick one rule the plane breaks — gravity, time, or magic — and make every scene about it. Planes that just look strange are forgettable; planes that invalidate a party's habits are not.",
      },
    ],
  },
  {
    id: "dm-prestige-classes",
    title: "Prestige Classes: What They're For",
    category: "Characters & Advancement",
    summary: "How prestige classes work, when to allow them, and how to write one that isn't broken.",
    tags: ["prestige", "advancement", "classes"],
    sections: [
      {
        heading: "Purpose",
        body:
          "A prestige class is earned in the fiction: an organization inducts you, a dragon's blood awakens, you master a discipline. Requiring an in-world event is what separates them from a normal multiclass dip.",
      },
      {
        heading: "Design guidelines",
        body:
          "- 5 or 10 levels; entry no earlier than character level 5–6.\n- Prerequisites should cost something (skill ranks, feats, alignment, a deed).\n- Grant either full spellcasting progression **or** strong combat features, rarely both.\n- One meaningful feature per level, front-loaded at most lightly, so a one-level dip is not the optimal play.",
      },
      {
        heading: "Approval at the table",
        body:
          "Ask the player what fantasy they are chasing, then approve the class or build an equivalent with the same feel. A refusal without an alternative is a dead end.",
      },
    ],
  },
  {
    id: "dm-improving-pcs",
    title: "How Characters Improve",
    category: "Characters & Advancement",
    summary: "Level-up procedure, retraining, downtime, and starting characters above 1st level.",
    tags: ["level up", "downtime", "retraining"],
    sections: [
      {
        heading: "Level-up procedure",
        body:
          "1. Choose the class for the new level.\n2. Roll or take fixed hit points, add Con modifier (minimum 1).\n3. Add skill points and spend them (max ranks = level + 3 for class skills).\n4. Update BAB and saves.\n5. Take a feat at every odd character level; an ability point at every 4th.\n6. Add class features and new spells known/per day.",
      },
      {
        heading: "Fixed hit points",
        body:
          "Many tables replace the hit die roll with average rounded up (d6→4, d8→5, d10→6, d12→7). It removes the unluckiest outcomes without inflating durability.",
      },
      {
        heading: "Downtime",
        body:
          "Between adventures, allow crafting, scribing scrolls, research, training a new skill or feat, running a business, or building a stronghold. Charge time and gold rather than saying no.",
      },
      {
        heading: "Starting above 1st level",
        body:
          "Give the new character the party's current level (or one below), standard wealth-by-level for that level, and no more than one magic item over a quarter of that budget.",
      },
    ],
  },
  {
    id: "dm-cohorts-familiars",
    title: "Cohorts, Familiars, Mounts and Companions",
    category: "Characters & Advancement",
    summary: "Running the party's second string without stealing the spotlight.",
    tags: ["cohort", "familiar", "animal companion", "leadership"],
    sections: [
      {
        heading: "Leadership cohorts",
        body:
          "A cohort is at least two levels below the leader and comes with a follower retinue based on the leader's Leadership score (level + Charisma modifier, adjusted by reputation and by how the leader has treated past followers). Cohorts earn a share of XP but should not out-shine any player's character.",
      },
      {
        heading: "Familiars and companions",
        body:
          "Familiars scale with master level (natural armor, Intelligence, special abilities) and share a bond that hurts to break — losing one costs experience and a piece of the character. Animal companions gain HD, bonus tricks and ability increases on the druid/ranger table.",
      },
      {
        heading: "Who plays them",
        body:
          "Let the player run their own companion in combat and let the DM speak for it out of combat. In this app you can hand any party NPC to the AI DM or take direct control yourself.",
      },
    ],
  },
];
