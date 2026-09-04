import type { WikiArticle } from "./dm-guide";

/**
 * Player-facing reference for the racial supplements, monster characters,
 * exalted/vile conduct, faith and divine rank, corrupt technology, and
 * fiend-binding prestige play. Original summaries of mechanics only.
 */

export const EXPANSION4_CATEGORIES = [
  "Races",
  "Monster Characters",
  "Exalted & Vile",
  "Faith & Deities",
  "Prestige Paths",
] as const;

export const EXPANSION4_ARTICLES: WikiArticle[] = [
  /* ------------------------------------------------------------ races --- */
  {
    id: "races-stone",
    title: "Races of Stone",
    category: "Races",
    summary:
      "Mountain and underground peoples: dwarves, gnomes, goliaths and the earth-bound builders, with their racial substitution levels and terrain feats.",
    tags: ["races", "dwarf", "gnome", "goliath", "mountains"],
    sections: [
      {
        heading: "The peoples",
        body: `- **Dwarves** — Constitution over Charisma, darkvision, stability against bull rush and trip, bonuses against poison and spells, and combat training against giants. Slow but never slowed by armour.
- **Gnomes** — Constitution over Strength, Small size, low-light vision, a few illusions at will, and bonuses against kobolds and goblinoids.
- **Goliaths** — a large-boned mountain people: Strength and Constitution over Dexterity, **powerful build** (they count as one size larger for grapple, trip, bull rush and oversized weapons), and acclimatisation to high altitudes. Powerful build is the headline: it makes them the strongest Medium grapplers in the game.`,
      },
      {
        heading: "Racial substitution levels",
        body: `A **racial substitution level** swaps the class features you would gain at one specific level for racially themed alternatives — a dwarf fighter trading a bonus feat for stonework defence, a gnome bard trading a song for an illusion trick.

You must take the substitution level at exactly that class level, you may take several across a career, and you keep everything else the class offers. They cost nothing but the feature you give up.`,
      },
      {
        heading: "Mountain and cavern play",
        body: `Feats and skills for this environment focus on climbing without gear, fighting on unstable footing, resisting cold and altitude, tunnelling, and stonecunning-style detection of worked rock. If your campaign spends real time underground, a single terrain feat is usually worth more than a generic combat feat.`,
      },
    ],
  },
  {
    id: "races-wild",
    title: "Races of the Wild",
    category: "Races",
    summary:
      "Elves, halflings, raptorans and the wilderness peoples, with flight-by-degrees, bounding movement and archery-focused options.",
    tags: ["races", "elf", "halfling", "raptoran", "wilderness"],
    sections: [
      {
        heading: "The peoples",
        body: `- **Elves** — Dexterity over Constitution, immunity to magic sleep, a bonus against enchantments, low-light vision, free proficiency with bows and elven blades, and automatic notice of nearby secret doors.
- **Halflings** — Dexterity over Strength, Small size, bonuses to jump, move silently and listen, a general bonus on saves and an extra bonus against fear, plus accuracy with thrown weapons and slings.
- **Raptorans** — a winged people who begin with **gliding** only, gain limited flight at mid levels, and true flight later, alongside a bonus to jump and to some wind-related effects. They are the way to play a flier without a level adjustment, at the price of waiting for the wings.`,
      },
      {
        heading: "Wilderness feats and skills",
        body: `This branch of options favours archery chains, mobility while shooting, tracking, foraging, camouflage and animal handling. Terrain feats let you treat one wilderness type as familiar ground — no movement penalty, better hiding, and faster overland travel.`,
      },
      {
        heading: "Communities",
        body: `Wild races tend toward small mobile settlements, which matters in play: expect to be a guest rather than a customer, expect favours to be repaid in favours rather than gold, and expect the local druid or elder to matter more than any lord.`,
      },
    ],
  },
  {
    id: "races-destiny",
    title: "Races of Destiny",
    category: "Races",
    summary:
      "Humans, half-elves, half-orcs and the civilised hybrid peoples — the races defined by adaptability and city life.",
    tags: ["races", "human", "half-elf", "half-orc", "illumian"],
    sections: [
      {
        heading: "The peoples",
        body: `- **Humans** — an extra feat and extra skill points at first level, no ability modifiers, and every class as a favoured class. Still the most flexible chassis in the game.
- **Half-elves** — elven immunities in a human frame, bonuses to social skills and to spotting, and easy multiclassing.
- **Half-orcs** — Strength over Intelligence and Charisma, darkvision, and orc blood for effects that care about it.
- **Illumians** — a people bonded to living sigils. They pick two **power sigils** at creation, whose pairing grants a specific benefit — extra skill uses, saves tied to an ability score, bonus damage, or better spell penetration — plus a small always-on trait. They reward planning your combination around the class you intend to play.`,
      },
      {
        heading: "City play",
        body: `Options in this line favour urban adventuring: navigating crowds, reading a street, fitting in with a guild, working the law, and fighting in confined spaces where reach and area effects betray you. Urban terrain feats do for a city what wilderness feats do for a forest.`,
      },
      {
        heading: "Adaptability",
        body: `The theme is **choice**. These races have few fixed strengths and many places to spend them: extra feats, extra skills, easy multiclassing, and substitution levels that let a human or half-orc reshape a class's mid levels. If you do not know what your character will become by 10th level, play one of these.`,
      },
    ],
  },
  {
    id: "races-dragon",
    title: "Races of the Dragon",
    category: "Races",
    summary:
      "Kobolds, spellscales and dragonborn — the dragonblooded peoples, plus the dragonborn rebirth that overwrites your old race's traits.",
    tags: ["races", "kobold", "spellscale", "dragonborn", "draconic"],
    sections: [
      {
        heading: "The peoples",
        body: `- **Kobolds** — Small, Strength-poor but Dexterity-quick, darkvision, natural armour, a bonus to craft trap and profession mining, and light sensitivity. Cheap, fragile, and excellent sorcerers and trapmakers.
- **Spellscales** — dragonblooded humanoids with a Charisma bonus and a Constitution penalty, low-light vision, and a shifting daily **mood** that grants a small varying benefit. Natural spontaneous casters.
- **Dragonborn** — not born but **reborn**. A character of almost any race can undergo the rite and become dragonborn.`,
      },
      {
        heading: "Becoming dragonborn",
        body: `The rebirth replaces your original race's traits with a fixed package — a Constitution bonus, a Dexterity penalty, dragon type, darkvision, immunity to sleep and paralysis, and a breath weapon or draconic sense — while you keep your class levels, feats, skills and any level adjustment you already had.

You then choose one aspect: **draconic mind** (senses and telepathy-adjacent awareness), **draconic heart** (better saves and endurance), or **draconic wings** (a fly speed with limits). Choose once; it is permanent.`,
      },
      {
        heading: "Draconic feats and heritage",
        body: `Dragonblood characters can take heritage feats that add natural armour, energy resistance, claws, or a small breath weapon that scales with character level, and they qualify for dragon-themed prestige classes. Combined with a sorcerer's spontaneous casting, they make the classic "dragon in a humanoid shape" build.`,
      },
    ],
  },

  /* ----------------------------------------------- monster characters --- */
  {
    id: "monster-characters",
    title: "Playing a Monster",
    category: "Monster Characters",
    summary:
      "Racial hit dice, level adjustment and effective character level decide what a monster costs to play; monster classes spread that cost over levels.",
    tags: ["monsters", "level adjustment", "ECL", "savage species"],
    sections: [
      {
        heading: "The three numbers",
        body: `Before you play a monster, work out:

1. **Racial hit dice** — free hit dice that come with the creature, with their own BAB, saves and skill points.
2. **Level adjustment (LA)** — a penalty representing power that hit dice do not measure: flight, spell-like abilities, huge ability bonuses.
3. **Effective character level (ECL)** = class levels + racial hit dice + LA.

Your ECL is what the party's level is compared against, and what decides your starting wealth and experience needs. A creature with 4 racial hit dice and +3 LA is already a 7th-level character before taking a single class level.`,
      },
      {
        heading: "Monster classes",
        body: `A **monster class** turns a creature into a level-by-level progression. Instead of arriving fully formed, you begin as a weaker version — smaller, without the natural attacks or the spell-like abilities — and gain the creature's traits as you take its class levels, finishing with the standard monster at the end.

This solves the biggest problem with monster PCs: the character is playable at low level alongside everyone else, and the power arrives on a schedule.`,
      },
      {
        heading: "Is it worth the level adjustment?",
        body: `A rule of thumb: **each point of LA must earn its keep at every level, not just at first.** A +2 LA that buys flight and darkvision is strong at 3rd level and unremarkable at 15th, by which point your class-level friends have flight too and you are two levels behind them permanently.

Prefer creatures whose benefits scale — extra limbs and natural attacks, large size, permanent immunities — over ones that grant a fixed spell-like ability.`,
      },
      {
        heading: "Advancement and templates",
        body: `Monsters can also grow by adding racial hit dice (which may increase size and reach) or by taking a **template** such as half-fiend or lycanthrope, which layers new abilities on top and usually adds LA of its own. Every template is a permanent purchase paid in effective levels; check with the DM before assuming one is available.`,
      },
    ],
  },

  /* --------------------------------------------------- exalted & vile --- */
  {
    id: "exalted-good-play",
    title: "Exalted Conduct and Sacred Power",
    category: "Exalted & Vile",
    summary:
      "Exalted characters bind themselves to strict good conduct and vows in exchange for sacred bonuses, exalted feats and sanctified magic.",
    tags: ["exalted", "good", "vows", "feats", "alignment"],
    sections: [
      {
        heading: "The standard",
        body: `An **exalted** character is not merely good; they hold to a demanding standard. Killing helpless or surrendered foes, using poison, torture, deception for personal gain, or evil magic all break it.

Breaking the standard costs you every exalted feat and ability until you atone. The abilities are strong precisely because the restrictions are real, so only take this path if you want the roleplaying constraint.`,
      },
      {
        heading: "Exalted feats and vows",
        body: `**Exalted feats** grant abilities normally reserved for celestials: healing touches, auras that protect allies, resistance to evil energies, or a strike that harms only the wicked. They require a good alignment and are lost the moment you fall.

**Vows** are exalted feats with an extra price — abstinence, chastity, nonviolence, obedience, peace, poverty or silence. Each grants a benefit scaled to how much the vow costs you in play. The vow of poverty is the extreme case: you give up nearly all magic items and wealth, and receive a growing package of bonuses in return.`,
      },
      {
        heading: "Sanctified magic and relics",
        body: `**Sanctified spells** are good-aligned magic that costs the caster something real — often ability damage or experience — and often can only be cast by an exalted character. **Relics** are holy items that only work fully in the hands of someone who meets a conduct requirement.

The design theme is consistent: good-aligned power is available, but it is paid for personally rather than bought.`,
      },
      {
        heading: "Facing corruption",
        body: `Opposing evil at this level means dealing with corruption effects — vile damage that ordinary healing does not repair, drain that requires consecrated ground, and temptations aimed at your vows. Carry a way to remove curses and disease, and expect the enemy to attack your conduct as much as your hit points.`,
      },
    ],
  },

  /* ------------------------------------------------- faith & deities --- */
  {
    id: "faith-deities-and-divine-rank",
    title: "Deities, Domains and Divine Rank",
    category: "Faith & Deities",
    summary:
      "Gods are ranked from quasi-deity to greater deity; a worshipper's practical concerns are domains, favoured weapons, conduct and divine intervention.",
    tags: ["deities", "domains", "clerics", "religion", "divine rank"],
    sections: [
      {
        heading: "What you get from a god",
        body: `For a player, a patron deity mainly decides four things:

- the two **domains** available to your cleric, and their granted powers
- the **favoured weapon** you can gain free proficiency with
- the **alignments** you may hold and the **conduct** expected of you
- the flavour of your spells, holy symbol and the community you can call on

Divine casters who defy their deity's expectations lose spellcasting until they atone. Agree with the DM in advance what "defying" means for your faith.`,
      },
      {
        heading: "Divine rank",
        body: `Deities are graded by **divine rank**, and the rank explains how much of the world they can touch:

- **rank 0 — quasi-deities:** immortal but not worshipped, no divine abilities to grant
- **ranks 1–5 — demigods:** local, able to grant spells, hard to kill
- **ranks 6–10 — lesser deities:** regional, with senses spanning miles and multiple simultaneous manifestations
- **ranks 11–15 — intermediate deities:** widely worshipped, effectively unassailable by mortals
- **ranks 16–20 — greater deities:** cosmic, aware of everything said in their name

Rank grants immunities, an automatic bonus to nearly every roll, remote sensing, avatars, and the ability to grant spells to clerics.`,
      },
      {
        heading: "Worship in play",
        body: `Practical faith looks like: consecrated ground that helps your side and hinders undead, festivals and holy days that gate certain rituals, temples that offer healing at a price, and a clergy hierarchy you can appeal to for aid. A cleric who cultivates their church has resources no amount of gold buys.`,
      },
      {
        heading: "Meeting a god",
        body: `Mortals almost never fight deities; they deal with **avatars**, servants and proxies. When a god does act directly, the outcome is a story beat, not a combat encounter. If your campaign heads that way, expect epic rules and divine salient abilities to be involved.`,
      },
    ],
  },
  {
    id: "chaositech-devices",
    title: "Chaositech: Corrupt Devices",
    category: "Exalted & Vile",
    summary:
      "Chaos-forged technology grants potent effects at the cost of unpredictability, addiction and bodily corruption — powerful loot with strings attached.",
    tags: ["chaositech", "items", "corruption", "evil"],
    sections: [
      {
        heading: "What it is",
        body: `**Chaositech** devices are neither magic items nor honest machines: they are grown, grafted and fuelled by raw chaos. They do things magic does — heal, kill, transform, see at a distance — but they follow no consistent rules of crafting or pricing, cannot be identified by ordinary spellcraft, and are usually unique.`,
      },
      {
        heading: "The cost",
        body: `Every device asks for something:

- **Unreliability** — a chance of misfiring, sometimes catastrophically
- **Addiction** — repeated use creates dependency; withdrawal imposes real penalties
- **Corruption** — grafts replace parts of your body permanently and can shift how others react to you
- **Attention** — the people who make these things want them back

Because the drawbacks land on the character rather than the wallet, chaositech is best treated as a plot item, not equipment you shop for.`,
      },
      {
        heading: "Using it at the table",
        body: `Agree up front how much your character is willing to become. A grafted arm that never comes off is a story choice with mechanical consequences, and a party with a corruption-tracking character should have a plan — and probably a cleric — for reversing it.`,
      },
    ],
  },

  /* ------------------------------------------------- prestige paths --- */
  {
    id: "prestige-demonologist",
    title: "Demonologist",
    category: "Prestige Paths",
    summary:
      "A 14-level evil arcane prestige class that charms, holds and finally dominates demons while mastering summoning and calling.",
    tags: ["prestige class", "demonologist", "conjuration", "evil"],
    sections: [
      {
        heading: "Requirements",
        body: `- **Alignment:** any evil
- **Skills:** Knowledge (arcana) 8 ranks, Knowledge (the planes) 8 ranks
- **Feats:** Evil Brand, Sacrificial Mastery, Malign Spell Focus
- **Special:** able to cast at least six arcane conjuration spells, one of them 3rd level or higher

**Hit die:** d4. **Skill points:** 4 + Int per level. **Class skills:** Alchemy, Bluff, Concentration, Decipher Script, Forgery, Intimidate, Knowledge (arcana, the planes, religion), Ride, Scry, Sense Motive, Spellcraft. No weapon, armour or shield proficiencies.`,
      },
      {
        heading: "Advancement table",
        body: `| Level | BAB | Fort | Ref | Will | Special | Spellcasting |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | +0 | +0 | +0 | +2 | Charm demon | — |
| 2 | +1 | +0 | +0 | +3 | Quasit familiar, push the demonic mind 1/day | +1 level |
| 3 | +1 | +1 | +1 | +3 | Summoning mastery +2 | +1 level |
| 4 | +2 | +1 | +1 | +4 | Resistances, fiendish legion +1, telepathy | +1 level |
| 5 | +2 | +1 | +1 | +4 | Poison immunity, unrestricted conjuration | +1 level |
| 6 | +3 | +2 | +2 | +5 | Summoning mastery +3 | +1 level |
| 7 | +3 | +2 | +2 | +5 | Hold demon | — |
| 8 | +4 | +2 | +2 | +6 | Push the demonic mind 2/day | +1 level |
| 9 | +4 | +3 | +3 | +6 | Summoning mastery +4, fiendish legion +1d4 | +1 level |
| 10 | +5 | +3 | +3 | +7 | Bonus feat | +1 level |
| 11 | +5 | +3 | +3 | +7 | Improved calling | +1 level |
| 12 | +6 | +4 | +4 | +8 | Summoning mastery +5 | +1 level |
| 13 | +6 | +4 | +4 | +8 | Dominate demon | +1 level |
| 14 | +7 | +4 | +4 | +9 | Fiendish legion +1d6+1, safe summoning, push the demonic mind 3/day | — |

"+1 level" means you gain spells per day, caster level and spells known as if you had gained a level in a spellcasting class you already had. Levels 1, 7 and 14 advance no spellcasting.`,
      },
      {
        heading: "Key class features",
        body: `- **Charm demon (Sp):** once per day per class level, charm a chaotic evil outsider as *charm person*. The demon does not get to use spell resistance, though it still saves (DC 11 + your Charisma modifier).
- **Enchanting demons:** your enchantment spells bypass demons' spell resistance and gain +4 to save DC against them.
- **Summoning mastery:** a growing bonus that makes the creatures you summon more effective.
- **Fiendish legion:** you call more creatures than the spell normally allows.
- **Push the demonic mind:** force a demon toward a course of action, a limited number of times per day.
- **Hold demon / dominate demon:** progressively stronger control over the fiends you deal with.
- **Unrestricted conjuration, improved calling, safe summoning:** you sidestep the usual limits and dangers of calling outsiders.`,
      },
      {
        heading: "Playing one",
        body: `You are a d4 caster with no armour, so your bound fiends are your front line and your bodyguards. The whole class rests on the party accepting an evil summoner — clear that with the table before you build it, and expect any good-aligned NPC who learns your trade to react accordingly.`,
      },
    ],
  },
];
