import type { WikiArticle } from "./dm-guide";

export const PLAYER_CATEGORIES = [
  "Character Basics",
  "Abilities",
  "Skills & Feats",
  "Combat",
  "Adventuring",
  "Magic",
  "Equipment",
] as const;

export const PLAYER_ARTICLES: WikiArticle[] = [
  {
    id: "how-the-game-works",
    title: "How the Game Works",
    category: "Character Basics",
    summary:
      "You describe what your hero does, the DM describes what happens, and dice settle anything uncertain. Everything else is detail.",
    tags: ["basics", "d20", "new player"],
    sections: [
      {
        heading: "The core mechanic",
        body: `Almost every uncertain action uses the same formula:

**d20 + modifiers vs. a target number**

- Beat or match the target and you succeed.
- The target is a **DC** (Difficulty Class) for skills, saves and checks, or an opponent's **AC** (Armor Class) for attacks.
- A natural 20 on an attack roll always hits (and may be a critical); a natural 1 always misses. Saving throws work the same way.`,
      },
      {
        heading: "The loop of play",
        body: `1. The DM describes the scene.
2. You say what your character tries to do.
3. If the outcome is in doubt, you roll.
4. The DM narrates the result and the scene moves on.

Outside combat, time is loose — minutes or days pass as needed. In combat, time is measured in **rounds** of 6 seconds.`,
      },
      {
        heading: "Rounding and stacking",
        body: `- Always round **down** unless a rule says otherwise.
- Bonuses of the **same named type** (dodge excepted) do not stack — take the highest.
- **Dodge** bonuses and most penalties always stack.`,
      },
    ],
  },
  {
    id: "building-a-character",
    title: "Building a Character, Step by Step",
    category: "Character Basics",
    summary: "The order to make decisions in so nothing traps you later.",
    tags: ["creation", "level 1", "checklist"],
    sections: [
      {
        heading: "The steps",
        body: `1. **Concept** — one sentence: who they are and what they want.
2. **Ability scores** — roll or point-buy, then assign.
3. **Race** — adjusts abilities, size, speed, and grants traits.
4. **Class** — determines hit die, attack progression, saves, skills, and features.
5. **Skills** — spend your skill points (×4 at 1st level).
6. **Feats** — one at 1st level, plus a human bonus feat and any class bonus feats.
7. **Spells or powers** — if your class casts or manifests, pick your starting list.
8. **Derived numbers** — hit points, AC, saves, attack bonus, initiative, speed.
9. **Details** — alignment, deity, age, height, name, and a hook for the DM.`,
      },
      {
        heading: "What to decide first",
        body: `Class matters most in play; race matters most at 1st level. If a race gives a **level adjustment**, your effective character level is higher than your class levels, so you will be behind the party in class features — take it only if the abilities are worth it.`,
      },
    ],
  },
  {
    id: "ability-scores",
    title: "Ability Scores and What They Do",
    category: "Abilities",
    summary: "Six numbers drive nearly every roll you make. Here is what each one actually touches.",
    tags: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
    sections: [
      {
        heading: "The modifier",
        body: `The score itself is rarely used; the **modifier** is.

**Modifier = (score − 10) ÷ 2, rounded down**

| Score | Mod | Score | Mod |
|---|---|---|---|
| 1 | −5 | 14–15 | +2 |
| 2–3 | −4 | 16–17 | +3 |
| 4–5 | −3 | 18–19 | +4 |
| 6–7 | −2 | 20–21 | +5 |
| 8–9 | −1 | 22–23 | +6 |
| 10–11 | +0 | 24–25 | +7 |
| 12–13 | +1 | 26–27 | +8 |`,
      },
      {
        heading: "What each ability governs",
        body: `- **Strength** — melee attack and damage, carrying capacity, Climb, Jump, Swim.
- **Dexterity** — AC, ranged attacks, initiative, Reflex saves, Hide, Move Silently, Tumble.
- **Constitution** — hit points per level, Fortitude saves, Concentration, holding your breath.
- **Intelligence** — skill points per level, bonus languages, wizard spellcasting, Knowledge skills.
- **Wisdom** — Will saves, Spot, Listen, Sense Motive, divine spellcasting.
- **Charisma** — Diplomacy, Bluff, Intimidate, turning undead, sorcerer and bard casting.`,
      },
      {
        heading: "Improving scores",
        body: `You gain **+1 to one ability score at 4th level and every four levels after** (8th, 12th, 16th, 20th, and onward). Magic items, inherent bonuses and some templates can also raise scores. An even score is what actually buys the modifier, so an odd score is often a wasted point.`,
      },
    ],
  },
  {
    id: "races-and-what-they-mean",
    title: "Choosing a Race",
    category: "Character Basics",
    summary: "Race sets your size, speed, senses and a package of traits — and sometimes a cost.",
    tags: ["race", "size", "level adjustment", "favored class"],
    sections: [
      {
        heading: "What a race gives you",
        body: `- **Ability adjustments** — applied before anything else.
- **Size** — Small creatures get +1 AC, +1 attack, +4 Hide, but use smaller weapons and carry less.
- **Speed** — usually 30 ft.; dwarves and most Small races move 20 ft.
- **Senses** — darkvision (see in total darkness, in black and white) or low-light vision (see twice as far in dim light).
- **Traits** — bonuses on saves and skills, weapon familiarity, spell-like abilities.
- **Favored class** — historically eases multiclass penalties.`,
      },
      {
        heading: "Level adjustment and racial hit dice",
        body: `Powerful races cost levels. **Effective Character Level (ECL) = class levels + racial Hit Dice + level adjustment.** The DM builds encounters against your ECL, so a +2 LA race is playing a level behind in class features for a long time. Take one because the concept excites you, not for raw power.`,
      },
    ],
  },
  {
    id: "classes-overview",
    title: "Classes: What Each One Is For",
    category: "Character Basics",
    summary: "The shape of every core class in one place, so you can tell the roles apart before you commit.",
    tags: ["class", "roles", "party"],
    sections: [
      {
        heading: "The core eleven",
        body: `| Class | Hit die | Skills/level | Good saves | Role |
|---|---|---|---|---|
| Barbarian | d12 | 4 | Fort | Rage, damage, mobility |
| Bard | d6 | 6 | Ref, Will | Buffs, faces, some magic |
| Cleric | d8 | 2 | Fort, Will | Healing, buffs, undead |
| Druid | d8 | 4 | Fort, Will | Nature magic, companion, wild shape |
| Fighter | d10 | 2 | Fort | Bonus feats, weapon mastery |
| Monk | d8 | 4 | All three | Unarmed, mobility, saves |
| Paladin | d10 | 2 | Fort | Smite evil, auras, healing |
| Ranger | d8 | 6 | Fort, Ref | Favored enemy, two styles, tracking |
| Rogue | d6 | 8 | Ref | Sneak attack, skills, traps |
| Sorcerer | d4 | 2 | Will | Spontaneous arcane casting |
| Wizard | d4 | 2 | Will | Prepared arcane casting, breadth |`,
      },
      {
        heading: "Base attack and saves",
        body: `- **Good BAB** (+1/level): barbarian, fighter, paladin, ranger.
- **Average BAB** (+3/4 level): bard, cleric, druid, monk, rogue.
- **Poor BAB** (+1/2 level): sorcerer, wizard.

A good save starts at +2 and rises to +12 at 20th; a poor save starts at +0 and reaches +6.`,
      },
      {
        heading: "Multiclassing and prestige classes",
        body: `You may add a level of any class when you level up. Your BAB and saves are the **sum** of each class's contribution, and spellcasting does **not** combine unless something explicitly advances it. **Prestige classes** have prerequisites — skill ranks, feats, BAB, casting level, sometimes story requirements — and reward a focused build.`,
      },
    ],
  },
  {
    id: "alignment-and-deity",
    title: "Alignment, Faith and Playing Your Character",
    category: "Character Basics",
    summary: "Alignment is a compass, not a cage — but some classes hold you to it.",
    tags: ["alignment", "roleplay", "deity"],
    sections: [
      {
        heading: "The nine alignments",
        body: `Two axes: **Lawful–Neutral–Chaotic** (order versus freedom) and **Good–Neutral–Evil** (altruism versus selfishness). Write down how *your* character interprets theirs — a lawful good soldier and a lawful good healer look nothing alike.`,
      },
      {
        heading: "Classes with restrictions",
        body: `- **Paladin** — must be lawful good; falls on a willing evil act.
- **Monk** — must be lawful; loses advancement if the alignment changes.
- **Barbarian** — cannot be lawful.
- **Druid** — must be partly neutral.
- **Cleric** — within one step of the deity, and picks two domains from the deity's list.

A DM may shift your alignment based on sustained behaviour. That is a signal, not a punishment — play toward it or away from it deliberately.`,
      },
    ],
  },
  {
    id: "using-skills",
    title: "Using Skills",
    category: "Skills & Feats",
    summary: "Ranks, class skills, synergy, taking 10 and taking 20 — the whole skill economy.",
    tags: ["skills", "ranks", "take 10", "synergy"],
    sections: [
      {
        heading: "The check",
        body: `**Skill check = d20 + ranks + ability modifier + other modifiers vs. DC**

Common DCs: very easy 0, easy 5, average 10, tough 15, challenging 20, formidable 25, heroic 30, nearly impossible 40.`,
      },
      {
        heading: "Ranks and maximums",
        body: `- Skill points per level = (class base + Int modifier), minimum 1; **×4 at 1st level**.
- **Class skill** maximum ranks = character level + 3, and each rank costs 1 point.
- **Cross-class** maximum ranks = half that, and each rank costs 2 points.
- Some skills can only be used if you have at least one rank (**trained only**), such as Disable Device, Spellcraft and Decipher Script.`,
      },
      {
        heading: "Taking 10 and taking 20",
        body: `- **Take 10** — when not rushed or threatened, treat the d20 as a 10. Use it for routine tasks.
- **Take 20** — assume you eventually roll a 20; takes 20× as long and only works when failure carries no penalty. You cannot take 20 on a check that risks harm, like disabling a live trap in most cases.`,
      },
      {
        heading: "Synergy",
        body: `Five or more ranks in one skill grants **+2** on certain related checks — for example Tumble helps Balance and Jump, Sense Motive helps Diplomacy, and Knowledge (arcana) helps Spellcraft.`,
      },
      {
        heading: "Armor check penalty",
        body: `Heavy armor and shields impose an **armor check penalty** on Balance, Climb, Escape Artist, Hide, Jump, Move Silently, Sleight of Hand, Swim (×2) and Tumble. Non-proficient armor applies the penalty to attack rolls too.`,
      },
    ],
  },
  {
    id: "feats",
    title: "Feats and Prerequisites",
    category: "Skills & Feats",
    summary: "How often you get feats, what the categories mean, and how chains work.",
    tags: ["feats", "prerequisites", "bonus feats"],
    sections: [
      {
        heading: "When you gain feats",
        body: `One feat at 1st level and one at every level divisible by three (3rd, 6th, 9th, …). Humans get one extra at 1st level. Fighters, wizards, monks and rangers gain bonus feats from restricted lists.`,
      },
      {
        heading: "Prerequisites",
        body: `A feat's prerequisites — ability scores, base attack bonus, skill ranks, other feats, class features — must be met **when you take it and kept while you use it**. Feat chains reward planning: Power Attack leads to Cleave and Improved Bull Rush; Dodge leads to Mobility and Spring Attack; Weapon Focus leads to Weapon Specialization.`,
      },
      {
        heading: "Kinds of feats",
        body: `- **General** — anyone may take them.
- **Fighter bonus** — combat feats a fighter can take with bonus slots.
- **Metamagic** — alter a spell you cast, usually raising its effective level.
- **Item creation** — let you craft magic items using time, gold and XP.
- **Psionic** — require a power point reserve or psionic focus.
- **Epic** — available at 21st level and beyond.`,
      },
    ],
  },
  {
    id: "combat-basics",
    title: "Combat: Rounds, Actions and Initiative",
    category: "Combat",
    summary: "What you can do in six seconds, and in what order.",
    tags: ["combat", "initiative", "actions", "round"],
    sections: [
      {
        heading: "Initiative",
        body: `Roll **d20 + Dexterity modifier** (plus Improved Initiative etc.) once per combat. Act in descending order each round. Surprised characters lose their first round; **flat-footed** characters lose their Dexterity bonus to AC until they act.`,
      },
      {
        heading: "Actions on your turn",
        body: `In a typical round you can take **one standard action + one move action + any number of free actions**, or a **full-round action** instead of both.

| Action | Examples |
|---|---|
| Standard | Attack, cast most spells, use most magic items |
| Move | Move your speed, draw a weapon (or free with BAB +1), stand up (provokes) |
| Full-round | Full attack, charge, run, coup de grace |
| Free | Speak, drop an item, cease concentration |
| Swift/Immediate | Quickened spells, some class features |

You may always take a move action in place of a standard action.`,
      },
      {
        heading: "Attacks of opportunity",
        body: `You threaten adjacent squares (more with reach). Provoking actions include moving out of a threatened square, casting a spell, using a ranged weapon, standing up, and drinking a potion. You get **one** attack of opportunity per round (more with Combat Reflexes). A **5-foot step** never provokes, but you cannot combine it with other movement in the same round.`,
      },
      {
        heading: "Iterative attacks",
        body: `A **full attack** gives extra attacks at BAB +6/+11/+16, each 5 lower: +11/+6/+1, for example. Two-weapon fighting adds an off-hand attack at a penalty, reduced by the Two-Weapon Fighting feat and a light off-hand weapon.`,
      },
    ],
  },
  {
    id: "attacks-ac-damage",
    title: "Attack Rolls, Armor Class and Damage",
    category: "Combat",
    summary: "The arithmetic behind hitting things and how much it hurts.",
    tags: ["attack", "AC", "damage", "critical"],
    sections: [
      {
        heading: "Attack and AC",
        body: `**Attack = d20 + BAB + Strength (or Dexterity for ranged) + size + other modifiers**

**AC = 10 + armor + shield + Dex + size + natural armor + deflection + dodge + misc**

- **Touch AC** ignores armor, shield and natural armor.
- **Flat-footed AC** ignores Dex and dodge bonuses.`,
      },
      {
        heading: "Common combat modifiers",
        body: `| Situation | Modifier |
|---|---|
| Flanking (melee) | +2 attack |
| Charging | +2 attack, −2 AC |
| Higher ground | +1 attack |
| Prone attacker (melee) | −4 attack |
| Invisible attacker | +2 attack, target loses Dex |
| Cover | +4 AC, +2 Reflex |
| Concealment | 20% miss chance (50% total) |`,
      },
      {
        heading: "Damage and criticals",
        body: `Damage = weapon die + Strength modifier (×1.5 for a two-handed weapon, ×0.5 for an off-hand weapon) + enhancements. On a natural roll in the weapon's **threat range**, roll again to confirm; if the confirmation would hit, multiply the damage by the weapon's multiplier. Extra dice such as sneak attack and flaming are **not** multiplied.`,
      },
      {
        heading: "Hit points, dying and healing",
        body: `- At **0 hp** you are disabled: one standard or move action per round, and acting costs 1 hp.
- From **−1 to −9** you are dying and lose 1 hp per round until stabilized (10% chance per round, or a DC 15 Heal check).
- At **−10** you die.
- Resting recovers 1 hp per character level per full day, or double with complete bed rest.`,
      },
    ],
  },
  {
    id: "special-attacks",
    title: "Special Attacks and Maneuvers",
    category: "Combat",
    summary: "Grapple, trip, disarm, bull rush, sunder, overrun and the rest.",
    tags: ["grapple", "trip", "disarm", "maneuvers"],
    sections: [
      {
        heading: "Opposed rolls",
        body: `- **Grapple** — touch attack, then opposed grapple checks (BAB + Str + size modifier). Grappling drops your Dex bonus to AC against others and limits you to light weapons.
- **Trip** — opposed Strength (or Dex) check; a tripped foe is prone. Failing lets them trip you back unless you used a tripping weapon.
- **Disarm** — opposed attack; the larger weapon and two-handed grip get bonuses. Failing lets them disarm you.
- **Bull rush** — push a target back 5 ft. plus 5 per 5 points of margin.
- **Sunder** — attack an object; it provokes without Improved Sunder.
- **Overrun** — move through a foe's square; they may block, avoid or be knocked prone.`,
      },
      {
        heading: "Other options",
        body: `- **Aid another** — DC 10 attack to give an ally +2 attack or AC.
- **Fight defensively** — −4 attack, +2 dodge AC (better with Combat Expertise).
- **Total defense** — +4 dodge AC, no attacks.
- **Coup de grace** — a full-round automatic critical against a helpless foe, plus a Fortitude save (DC 10 + damage) or death.`,
      },
    ],
  },
  {
    id: "conditions",
    title: "Conditions You Will Actually See",
    category: "Combat",
    summary: "A quick reference for the states that keep coming up mid-fight.",
    tags: ["conditions", "status", "reference"],
    sections: [
      {
        heading: "Quick reference",
        body: `| Condition | Effect |
|---|---|
| Blinded | −2 AC, lose Dex to AC, half speed, 50% miss chance |
| Dazed | No actions for 1 round; can still defend |
| Stunned | Drop held items, lose Dex to AC, −2 AC, no actions |
| Prone | −4 melee attack, +4 AC vs. ranged, −4 AC vs. melee |
| Shaken / Frightened / Panicked | −2 on attacks, saves, checks; frightened must flee; panicked drops items |
| Entangled | −2 attack, −4 Dex, half speed |
| Exhausted / Fatigued | Fatigued: −2 Str and Dex, no run or charge; exhausted: −6 and half speed |
| Nauseated | Only a single move action per round |
| Paralyzed / Helpless | Dex counts as 0, attackers get +4 and may coup de grace |
| Flat-footed | Lose Dex and dodge bonuses to AC |
| Invisible | +2 attack, target loses Dex to AC |`,
      },
      {
        heading: "Damage that is not hit points",
        body: `**Ability damage** reduces a score temporarily and heals 1/day. **Ability drain** is permanent until restored. **Negative levels** give −1 on nearly everything per level and may become permanent after 24 hours. **Nonlethal damage** knocks you unconscious when it equals your hit points.`,
      },
    ],
  },
  {
    id: "movement-exploration",
    title: "Movement, Terrain and Exploration",
    category: "Adventuring",
    summary: "Tactical movement, overland travel, climbing, swimming and falling.",
    tags: ["movement", "travel", "falling", "grid"],
    sections: [
      {
        heading: "On the grid",
        body: `One square = 5 ft. The **first diagonal costs 5 ft., the second costs 10 ft.**, alternating. Difficult terrain costs double. You can move your speed and still take a standard action, double move with two move actions, or **run** ×4 (×3 in heavy armor) in a straight line.`,
      },
      {
        heading: "Overland travel",
        body: `| Speed | Per hour | Per day |
|---|---|---|
| 15 ft. | 1.5 miles | 12 miles |
| 20 ft. | 2 miles | 16 miles |
| 30 ft. | 3 miles | 24 miles |
| 40 ft. | 4 miles | 32 miles |

Roads help, trackless terrain halves progress, and forced marches require Constitution checks.`,
      },
      {
        heading: "Climb, swim, jump, fall",
        body: `- **Climb** — half speed; failing by 5 or more means falling. You lose your Dex bonus to AC while climbing.
- **Swim** — DC by water conditions; failing by 5 means going under.
- **Jump** — DC equals distance in feet for a long jump with a running start; ×4 without one.
- **Falling** — 1d6 per 10 ft., maximum 20d6. A DC 15 Jump check reduces it as if the fall were 10 ft. shorter.`,
      },
      {
        heading: "Vision and light",
        body: `A torch lights 20 ft. (shadowy for another 20). Darkvision is 60 ft. and colourless; low-light vision doubles the radius of any light source. Shadowy illumination grants **concealment** — a 20% miss chance.`,
      },
    ],
  },
  {
    id: "encumbrance-and-money",
    title: "Carrying Capacity, Coins and Buying Gear",
    category: "Equipment",
    summary: "How much you can haul and how much things cost.",
    tags: ["encumbrance", "coins", "shopping"],
    sections: [
      {
        heading: "Load",
        body: `Capacity scales with Strength. A **medium load** costs 10 ft. of speed, caps your Dex bonus to AC at +3 and gives a −3 armor check penalty; a **heavy load** is worse (+1 Dex cap, −6 check penalty, and no running). Small characters carry ¾ as much; quadrupeds carry more.`,
      },
      {
        heading: "Coins",
        body: `10 copper = 1 silver, 10 silver = 1 gold, 10 gold = 1 platinum. Fifty coins weigh one pound. Gems and art objects are the practical way to move real wealth.`,
      },
      {
        heading: "Buying and selling",
        body: `Selling used goods usually fetches **half price**; trade goods and gems sell at full value. Settlement size caps the most expensive item available for sale — a village will not stock a +3 weapon.`,
      },
    ],
  },
  {
    id: "weapons-armor",
    title: "Weapons and Armor",
    category: "Equipment",
    summary: "Proficiency, weapon categories, armor tradeoffs and what the numbers mean.",
    tags: ["weapons", "armor", "proficiency", "shields"],
    sections: [
      {
        heading: "Proficiency",
        body: `Using a weapon you are not proficient with is **−4 to attack**. Wearing armor you are not proficient with applies the armor check penalty to attack rolls and most Strength- and Dexterity-based skills. Arcane casters suffer **arcane spell failure** in armor.`,
      },
      {
        heading: "Weapon categories",
        body: `- **Simple** — clubs, daggers, spears, crossbows; nearly everyone is proficient.
- **Martial** — longswords, battleaxes, longbows; fighters, barbarians, rangers, paladins.
- **Exotic** — spiked chain, bastard sword one-handed, dwarven waraxe; needs a specific feat.

**Light** weapons can be used off-hand and with Weapon Finesse. **Reach** weapons threaten at 10 ft. but not adjacent squares.`,
      },
      {
        heading: "Armor tradeoffs",
        body: `| Category | Typical AC | Max Dex | Check penalty | Speed |
|---|---|---|---|---|
| Light (leather, chain shirt) | +2 to +4 | +4 to +6 | 0 to −2 | Full |
| Medium (hide, breastplate) | +3 to +5 | +2 to +3 | −3 to −4 | 20 ft. from 30 |
| Heavy (splint, full plate) | +6 to +8 | +1 | −5 to −6 | 20 ft., no run ×4 |

A shield adds its bonus but occupies a hand; a buckler leaves the hand mostly free at −1 attack when you use that hand.`,
      },
    ],
  },
  {
    id: "spellcasting",
    title: "Casting Spells",
    category: "Magic",
    summary: "Slots, preparation, saving throws, concentration and the components everyone forgets.",
    tags: ["spells", "casting", "DC", "concentration"],
    sections: [
      {
        heading: "Prepared vs. spontaneous",
        body: `- **Prepared casters** (wizard, cleric, druid) choose spells in advance after 8 hours of rest and 1 hour of preparation. Wizards learn from a spellbook; clerics and druids access their whole list.
- **Spontaneous casters** (sorcerer, bard) know fewer spells but cast any known spell using an open slot of that level.

You need a minimum ability score of **10 + spell level** to cast a spell, and that ability grants **bonus slots**.`,
      },
      {
        heading: "Save DCs and resistance",
        body: `**Spell save DC = 10 + spell level + casting ability modifier.**

**Spell resistance** requires a caster level check (d20 + caster level) to beat the target's SR. Some spells allow no save at all; some allow a save for half damage.`,
      },
      {
        heading: "Components and concentration",
        body: `Most spells need **verbal**, **somatic** and sometimes **material** or **focus** components — being gagged, bound or in a silence effect stops them. Casting in a threatened square provokes an attack of opportunity; if you are damaged while casting, make a **Concentration check (DC 10 + damage + spell level)** or lose the spell.`,
      },
      {
        heading: "Metamagic",
        body: `Metamagic feats raise a spell's effective slot level — Empower +2, Maximize +3, Quicken +4, Still and Silent +1. Prepared casters must prepare the modified version; spontaneous casters apply it on the fly but take a full-round action.`,
      },
    ],
  },
  {
    id: "schools-and-descriptors",
    title: "Schools, Descriptors and Reading a Spell",
    category: "Magic",
    summary: "What the block of text at the top of every spell is telling you.",
    tags: ["schools", "descriptors", "spell format"],
    sections: [
      {
        heading: "The eight schools",
        body: `**Abjuration** (protection), **Conjuration** (summoning, teleport, healing), **Divination** (information), **Enchantment** (mind control), **Evocation** (raw energy), **Illusion** (deception), **Necromancy** (life and death), **Transmutation** (change). A specialist wizard gains an extra slot per level and gives up two schools.`,
      },
      {
        heading: "The stat block",
        body: `- **Casting time** — usually a standard action.
- **Range** — close (25 ft. + 5 per 2 levels), medium (100 + 10/level), long (400 + 40/level).
- **Area / Target** — who it touches.
- **Duration** — instantaneous, rounds/level, concentration, dismissible.
- **Saving throw** — Fortitude, Reflex, Will, and whether it negates, halves or partials.
- **Spell resistance** — yes or no.`,
      },
      {
        heading: "Descriptors matter",
        body: `Tags like *fire*, *cold*, *mind-affecting*, *death*, *evil* and *light* determine what resists you. Constructs and undead ignore most mind-affecting effects; elementals are immune to critical hits and flanking.`,
      },
    ],
  },
  {
    id: "leveling-up",
    title: "Levelling Up and Experience",
    category: "Adventuring",
    summary: "What changes when you gain a level, in the order you should apply it.",
    tags: ["XP", "level up", "hit points"],
    sections: [
      {
        heading: "The XP track",
        body: `You need **level × 1,000** cumulative XP to reach the next level: 1,000 for 2nd, 3,000 for 3rd, 6,000 for 4th, 10,000 for 5th, and so on. XP is awarded by encounter, scaled to the difficulty relative to your level, plus story awards.`,
      },
      {
        heading: "What to update",
        body: `1. Choose the class for this level.
2. Roll (or take the average of) your hit die and add your Con modifier — minimum 1 hp.
3. Update base attack bonus and saves.
4. Spend skill points (class-skill cap = level + 3).
5. Take a feat at 3rd, 6th, 9th, and so on.
6. Add class features and new spell slots or powers.
7. At 4th, 8th, 12th, 16th and 20th, add +1 to an ability score.`,
      },
      {
        heading: "Beyond 20th",
        body: `Epic levels continue the story: hit dice and skill points keep coming, base attack and saves grow more slowly through **epic attack and save bonuses**, and you gain an epic feat every few levels. Spellcasters keep gaining caster level and can research epic spells.`,
      },
    ],
  },
  {
    id: "playing-well",
    title: "Playing Your Part at the Table",
    category: "Adventuring",
    summary: "Practical habits that make sessions better, whether it is your first or your hundredth.",
    tags: ["roleplay", "teamwork", "etiquette"],
    sections: [
      {
        heading: "Habits worth having",
        body: `- **Say what you want, not the rule you want.** "I try to knock him off the bridge" is better than naming a maneuver.
- **Know your own numbers.** Attack, AC, saves, initiative and your three favourite abilities.
- **Build a reason to travel with these people.** Solo brooders slow the game down.
- **Take notes on names.** The DM's NPCs get better when you remember them.
- **Fail forward.** A missed check is an opening for a new plan, not the end of a scene.`,
      },
      {
        heading: "Party balance",
        body: `You want someone who can take a hit, someone who can heal or restore, someone who can find and disable danger, and someone who can solve problems with magic. Any class can cover several of those; make sure between you all four are covered.`,
      },
    ],
  },
];
