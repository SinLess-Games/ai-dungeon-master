import type { WikiArticle } from "./dm-guide";

/**
 * Player-facing reference for martial maneuvers, optional/variant rules,
 * legacy items, and mass combat. Original summaries of mechanics only.
 */

export const EXPANSION3_CATEGORIES = [
  "Martial Maneuvers",
  "Variant Rules",
  "Legacy Items",
  "Mass Combat",
] as const;

export const EXPANSION3_ARTICLES: WikiArticle[] = [
  /* ----------------------------------------------- martial maneuvers --- */
  {
    id: "maneuvers-basics",
    title: "Maneuvers, Stances and Recovery",
    category: "Martial Maneuvers",
    summary:
      "Martial adepts learn maneuvers and stances from combat disciplines, ready a subset for a fight, expend them as they strike, and recover them mid-battle.",
    tags: ["maneuvers", "stances", "martial adept", "combat"],
    sections: [
      {
        heading: "How it works",
        body: `A **martial adept** treats fighting like a spellcaster treats magic, but the resource cycles inside a single fight.

- **Maneuvers known** — the full list your class has learned.
- **Maneuvers readied** — the smaller set you have prepared and can use right now.
- **Expending** — using a maneuver spends it until you recover.
- **Recovery** — each class has its own action to refresh all expended maneuvers (a quick pause, a successful attack, or a brief withdrawal), so a long fight is a rhythm of spending and recovering rather than running dry.

Most maneuvers are **strikes** (an attack with an extra effect), **boosts** (a swift-action self-buff), **counters** (an immediate action reaction) or **rush/movement** effects.`,
      },
      {
        heading: "Stances",
        body: `A **stance** is not expended. You enter one as a swift action and it stays on until you switch, and only one can be active at a time. Stances grant persistent benefits: extra damage, better defence, improved movement, or a special sense.

The usual opening move of a fight is: enter the right stance, then start spending strikes.`,
      },
      {
        heading: "Initiator level and prerequisites",
        body: `Your **initiator level** equals your martial adept class levels plus half your other class levels. Higher-level maneuvers require both a minimum initiator level and a number of lower-level maneuvers already known from the same discipline, so each discipline is a ladder you climb.`,
      },
      {
        heading: "The disciplines",
        body: `Each discipline has an associated skill and weapon group, and a clear identity:

- crushing, overwhelming melee damage
- precise strikes that ignore defences and hit weak points
- desert-wind style mobility and fire
- shadow-based stealth, teleporting steps and debilitating touches
- defensive protection of allies and healing-like recovery
- iron-willed endurance and damage reduction
- swift, ranged and mobile ranged support
- disciplined counters and duelling ripostes
- overwhelming charges and mounted force

Focus two or three disciplines rather than sampling all of them — the prerequisite ladder punishes spreading thin.`,
      },
    ],
  },
  {
    id: "maneuvers-classes",
    title: "The Martial Adept Classes",
    category: "Martial Maneuvers",
    summary:
      "Three classes use maneuvers: a full-progression warrior, a lightly armoured mobile striker, and a defensive protector with divine leanings.",
    tags: ["maneuvers", "classes", "warblade", "swordsage", "crusader"],
    sections: [
      {
        heading: "The versatile warrior",
        body: `Full base attack, d12 hit dice, heavy on damage disciplines. Recovers maneuvers by taking a swift action and making an attack, so it refreshes constantly in an active fight. Also gains Intelligence-based combat bonuses, making it a rare warrior who wants a good mental score.`,
      },
      {
        heading: "The mobile striker",
        body: `Light armour, d8 hit dice, three-quarters attack progression, but the widest maneuver selection and the most readied maneuvers. Recovers by spending a full-round action to refocus, so it front-loads a burst of powerful strikes and then needs a beat to reset. Best played with skills, mobility and precision damage.`,
      },
      {
        heading: "The defender",
        body: `Heavy armour, d10 hit dice, full attack progression, focused on protecting allies and absorbing punishment, with temporary hit points, damage reduction and healing-adjacent strikes. Its readied maneuvers are granted semi-randomly each round, which makes it unpredictable but never empty-handed.`,
      },
      {
        heading: "Multiclassing and feats",
        body: `Feats exist that let any character learn one maneuver or one stance, which is a cheap way to add a martial trick to a fighter or barbarian. Multiclassing into an adept works, but remember initiator level counts only half of your other levels — dipping late means low-level maneuvers.`,
      },
    ],
  },

  /* ---------------------------------------------------- variant rules --- */
  {
    id: "variants-character-build",
    title: "Variant Character Building",
    category: "Variant Rules",
    summary:
      "Optional systems replace or extend the standard build: character traits and flaws, class feature swaps, generic classes and bloodlines.",
    tags: ["variant", "traits", "flaws", "optional rules"],
    sections: [
      {
        heading: "Traits and flaws",
        body: `A **trait** is a small package of one benefit and one drawback (for example, quicker but frailer). You may take up to two, and they cost nothing.

A **flaw** is a pure drawback taken at 1st level in exchange for one extra feat. Most tables cap this at two flaws. Flaws are only fair when the drawback genuinely bites in your campaign — a flaw against ranged attacks in a dungeon game is close to free.

Both require DM approval; they change the balance of first level noticeably.`,
      },
      {
        heading: "Class feature variants",
        body: `Many class features can be swapped for an alternative of similar value: trading a familiar for a combat bonus, an animal companion for spontaneous casting, heavy armour proficiency for extra speed and defence, or turning undead for a different pool of uses.

The rule of thumb is one feature for one feature, decided when you first gain it, and not reversible without retraining.`,
      },
      {
        heading: "Generic and bloodline options",
        body: `- **Generic classes** collapse the class list into three broad chassis — warrior, expert and spellcaster — that pick bonus feats to define themselves. Good for low-fantasy or highly custom concepts.
- **Bloodlines** add ancestry (draconic, celestial, fiendish and so on) as a slow drip of abilities that costs you character levels rather than a level adjustment, so the power arrives gradually instead of all at once.`,
      },
    ],
  },
  {
    id: "variants-combat-and-magic",
    title: "Variant Combat and Magic Systems",
    category: "Variant Rules",
    summary:
      "Optional rules change how damage, defence, spell recovery and casting risk work — armour as damage reduction, vitality and wounds, spell points, and taxing magic.",
    tags: ["variant", "combat", "magic", "optional rules"],
    sections: [
      {
        heading: "Armour as damage reduction",
        body: `Instead of raising AC, armour subtracts a flat amount from every hit while giving a smaller defence bonus. Fights become grittier and longer against small weapons, and heavy armour protects against volume rather than accuracy. Expect to rebalance monsters that rely on many weak attacks.`,
      },
      {
        heading: "Vitality and wound points",
        body: `Hit points split into **vitality** (luck and stamina, restored quickly) and **wounds** (real injury, equal to your Constitution, healed slowly). Critical hits bypass vitality and damage wounds directly. The result is deadlier, more cinematic combat where a single unlucky critical can end a character.`,
      },
      {
        heading: "Spell points",
        body: `Casters replace slots with a **pool of points**, spending more points for higher-level spells and optionally overspending to boost a spell. This makes casters more flexible day to day — and stronger in short adventuring days, so many tables pair it with more encounters between rests.`,
      },
      {
        heading: "Risky and reserve magic",
        body: `Other variants attach a cost or risk to casting: a Constitution or fatigue toll for powerful spells, a chance of a wild effect when pushing beyond your level, or reserve-style abilities that stay available while you keep a spell unused. All of them shift casters away from "save the big spell" toward steady expenditure.`,
      },
      {
        heading: "Using variants at your table",
        body: `Adopt one variant at a time, agree it in session zero, and write it down. Variants interact — armour as damage reduction plus vitality and wounds is a very different game from the standard rules, and characters built for one may be unplayable under the other.`,
      },
    ],
  },

  /* ---------------------------------------------------- legacy items --- */
  {
    id: "legacy-items-basics",
    title: "Legacy Weapons and Items",
    category: "Legacy Items",
    summary:
      "A legacy item grows with its wielder through rituals, unlocking tiers of powers at a permanent personal cost.",
    tags: ["legacy items", "magic items", "rituals"],
    sections: [
      {
        heading: "What makes an item a legacy",
        body: `A **legacy item** is tied to a story: a famous blade, a crown, a relic of a fallen order. In the wrong hands it functions as an ordinary — often mundane — item. Once you complete its rituals, it awakens and keeps improving as your character level rises, so you never outgrow it.`,
      },
      {
        heading: "Rituals",
        body: `Each item has a chain of rituals, usually three, tied to its history — visiting a place, defeating a specific kind of foe, recovering a lost fragment, performing a rite. Each ritual has a gold cost, a minimum character level, and a story requirement your DM will stage as an adventure.

Completing a ritual unlocks the next tier of the item's abilities.`,
      },
      {
        heading: "The price",
        body: `Legacy power is paid for personally, not in gold. Depending on the tier, the item permanently imposes some mix of:

- lost hit points
- a penalty to one or more saving throws
- a penalty to attack rolls, caster level checks, or a skill
- a lost spell slot per day

These penalties never go away while you are attuned. That is the trade: an item that scales forever in exchange for a shrinking character sheet.`,
      },
      {
        heading: "Is it worth it?",
        body: `A legacy item is strong when its abilities match your build, when your DM will run the ritual adventures, and when you plan to keep the character for a long campaign. It is a poor deal for a short game, for a character who might die soon, or when the penalties hit your primary stat. Read the whole progression before the first ritual — you are committing to the endpoint, not the first tier.`,
      },
    ],
  },

  /* ----------------------------------------------------- mass combat --- */
  {
    id: "mass-combat-armies",
    title: "Armies and Units",
    category: "Mass Combat",
    summary:
      "Mass battles group identical creatures into units on a rescaled grid, so hundreds of combatants play at roughly the speed of a normal fight.",
    tags: ["mass combat", "armies", "units", "war"],
    sections: [
      {
        heading: "Building an army",
        body: `An army is made of **units**. Every creature in a unit must be effectively identical — same size, same speed, and close enough in level, armour and weapons that one typical member's statistics can stand for all of them. Different creature types go in different units, and an army may field several copies of the same unit.

Keep an army to about ten units at most (four to six plays best); more than that turns a battle into bookkeeping.`,
      },
      {
        heading: "Grid scale",
        body: `The battle map is rescaled so one square holds many creatures. Pick the scale from unit size:

- **Small units** (up to ~100 creatures) — 15 ft. per square, about 10 medium creatures per square
- **Medium units** (~100–400) — 25 ft. per square, about 25 medium creatures
- **Large units** (~400–1,600) — 50 ft. per square, about 100 medium creatures
- **Very large units** (~1,600–6,400) — 100 ft. per square, about 400 medium creatures
- **Epic units** (beyond that) — 200 ft. per square

Shift one scale up for each size category above Medium and one down for each below Small. Aim for four to sixteen counters per unit: fewer counters is faster but more abstract. Once chosen, every unit uses the same scale for the whole battle.`,
      },
      {
        heading: "Formations and shape",
        body: `A unit may take any shape as long as its squares are connected. Changing formation is an action taken inside the unit, and formation matters: a wide line brings more attackers to bear, a column moves and turns faster, a block resists being broken through.`,
      },
    ],
  },
  {
    id: "mass-combat-running-a-battle",
    title: "Running a Battle",
    category: "Mass Combat",
    summary:
      "Units roll initiative, take unit actions, check morale, take casualties and can recover — while player characters still act as individuals.",
    tags: ["mass combat", "morale", "initiative", "casualties"],
    sections: [
      {
        heading: "The round",
        body: `Units roll **initiative** like characters do and act on their turn. A unit's turn is one **unit action** — move, attack, charge, hold, change formation, rally — resolved with the unit's aggregate statistics rather than by rolling for every soldier.

Player characters keep acting as individuals on their own initiative. That is the point of the system: your character's decisions still matter inside a battle far too big to run creature by creature.`,
      },
      {
        heading: "Casualties",
        body: `Damage to a unit is tracked as **casualties** — counters or squares removed rather than hit points per soldier. A unit that loses a large share of its strength becomes less effective at attacking and easier to break. Some casualties are wounded rather than dead, and a unit that holds the field afterwards can **recover** a portion of them once the fighting stops.`,
      },
      {
        heading: "Morale",
        body: `Morale, not casualties, usually decides a battle. A unit checks morale when it takes heavy losses, loses its commander, faces a terrifying enemy, or sees an allied unit break.

Circumstances and modifiers push the check up or down: training and veterancy, the presence of a leader, a recent victory, being flanked or surrounded, fighting on home ground. Failure means the unit falters, withdraws, or routs outright — and a routing unit can drag its neighbours with it.`,
      },
      {
        heading: "Where heroes fit",
        body: `Player characters change battles by doing what units cannot: killing an enemy commander to force morale checks, breaking a gate, countering the enemy's spellcaster, or rallying a broken unit in person. Ask the DM what the objective is before charging in — winning the war rarely means killing every soldier.`,
      },
    ],
  },
];
