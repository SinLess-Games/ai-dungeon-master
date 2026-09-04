import type { WikiArticle } from "./dm-guide";

/**
 * Player-facing reference for dragon lore and draconic characters, magic item
 * handling, incarnum (soulmelds and essentia), and the second wave of core
 * character options. All text is an original summary of the mechanics.
 */

export const EXPANSION2_CATEGORIES = [
  "Dragons",
  "Magic Items",
  "Incarnum",
  "Advanced Options",
] as const;

export const EXPANSION2_ARTICLES: WikiArticle[] = [
  /* --------------------------------------------------------- dragons --- */
  {
    id: "dragons-know-your-enemy",
    title: "Understanding Dragons",
    category: "Dragons",
    summary:
      "Dragons grow through twelve age categories, gaining size, hit dice, breath weapon damage, spellcasting and aura strength as they age.",
    tags: ["dragons", "age categories", "monsters"],
    sections: [
      {
        heading: "Age categories",
        body: `Every true dragon advances through twelve age categories, from **wyrmling** up through very young, young, juvenile, young adult, adult, mature adult, old, very old, ancient, wyrm and finally **great wyrm**.

Each step forward means:

- more racial hit dice (and with them better attacks, saves and skills)
- a larger size category eventually, changing reach, AC and grapple
- stronger natural armour and higher ability scores
- a bigger breath weapon (damage usually rises by dice with each category)
- a stronger frightful presence aura, and for most kinds, more spells known and a higher caster level

A dragon of the same colour can therefore be anything from a nuisance to a campaign-ending threat. Ask what age category you are facing before you decide to fight.`,
      },
      {
        heading: "Chromatic and metallic",
        body: `**Chromatic** dragons (black, blue, green, red, white) are typically evil; **metallic** dragons (brass, bronze, copper, gold, silver) are typically good. Colour also tells you the breath weapon and the terrain:

- black — acid line, swamps
- blue — lightning line, deserts
- green — acid cone, forests
- red — fire cone, mountains
- white — cold cone, arctic
- brass — fire line and sleep gas, deserts
- bronze — lightning line and repulsion gas, coasts
- copper — acid line and slow gas, hills
- gold — fire cone and weakening gas, anywhere
- silver — cold cone and paralysis gas, mountain peaks

Most dragons are immune to their own energy type as well as to sleep and paralysis effects.`,
      },
      {
        heading: "Fighting a dragon",
        body: `Preparation beats bravery.

- **Buy the right defences.** Resistance or immunity to the dragon's energy type turns the signature attack into an inconvenience. Protection against fear counters frightful presence.
- **Deny it the sky.** A flying dragon that can hover and breathe every 1d4 rounds will win a shooting match. Fight indoors, ground it, or bring flight of your own.
- **Expect spells.** Older dragons cast as sorcerers and often open with buffs before you ever see them.
- **Watch the full attack.** Bite, two claws, two wings, tail slap and crush all in one round is how dragons kill parties — deny them a full attack whenever you can.
- **Divide the aura.** Frightful presence is a Will save; a single *heroes' feast* or a bard can neutralise it for the whole group.`,
      },
      {
        heading: "Lairs and hoards",
        body: `A dragon's lair is a defensive work, not a cave with treasure in it: multiple entrances sized for the dragon and not for you, flooded or airless passages, guardian minions, alarms, and a hoard placed where the dragon can fight over it. Older dragons will also have escape routes and contingency magic. Treat a lair assault as a dungeon with an intelligent, mobile boss who knows every corridor.`,
      },
    ],
  },
  {
    id: "dragons-draconic-characters",
    title: "Draconic Characters and Bloodlines",
    category: "Dragons",
    summary:
      "Draconic heritage gives characters breath weapons, natural armour, energy resistance and dragon-themed feats, spells and prestige options.",
    tags: ["dragons", "bloodline", "feats", "breath weapon"],
    sections: [
      {
        heading: "Claiming the blood",
        body: `Characters with dragon ancestry take **heritage feats**: an initial feat that marks your bloodline and picks a dragon kind, then a chain of follow-up feats that each unlock one draconic trait — natural armour, energy resistance, claws, wings and eventually a limited **breath weapon** usable a few times per day.

The bloodline feats scale with your character level rather than with a class, so they work for any class. They also serve as prerequisites for draconic prestige classes and for dragon-themed spells.`,
      },
      {
        heading: "Breath-weapon classes",
        body: `Some classes make the breath weapon the whole point. The typical shape is:

- a **breath effect usable at will** as a standard action, dealing damage on a scaling die progression by class level, with a Reflex save for half
- a menu of **shape and effect invocations** that reshape the breath (cone or line) or add a rider (blinding, weakening, entangling)
- a small set of always-on defensive abilities: natural armour, energy immunity, damage reduction at higher levels

Because the breath is at-will but limited to once every few rounds, these characters are steady damage dealers rather than burst casters.`,
      },
      {
        heading: "Auras and totem leaders",
        body: `Another draconic route is the **aura leader**: you pick a dragon totem at first level and project an aura that helps the whole party — a bonus to saves against fear, energy resistance, a swim or fly speed, extra damage, or fast healing. Only one aura is active at a time and you swap it as a swift action, so scouting ahead of a fight matters.

These characters also gain touch healing for allies and, later, limited draconic senses such as blindsense and darkvision.`,
      },
      {
        heading: "Dragon magic",
        body: `Dragon-themed spells and items usually do one of four things: mimic a breath weapon, grant a draconic physical trait for a duration, communicate with or command dragons, or protect specifically against a dragon's aura and breath. When building a dragon-hunting character, take at least one of each — offence, mobility, and a targeted defence.`,
      },
    ],
  },

  /* ----------------------------------------------------- magic items --- */
  {
    id: "items-slots-and-body",
    title: "Item Slots and Wearing Magic",
    category: "Magic Items",
    summary:
      "Worn magic items occupy body slots, one item per slot; slotless items work alongside them but cost more.",
    tags: ["magic items", "slots", "equipment"],
    sections: [
      {
        heading: "The slots",
        body: `A character can benefit from one magic item in each of these places at a time: head, face/eyes, neck (throat), shoulders, body (robes and vestments), torso (armour), arms/bracers, hands/gloves, one ring on each hand (two rings total), waist (belt), and feet.

Wearing two items in the same slot means only one functions — usually the one you put on first — so plan your kit as a set rather than a pile.`,
      },
      {
        heading: "Slotless items",
        body: `Wondrous items that occupy no slot — figurines, stones, bags, horns, weapons and shields you hold — always work. Because they never compete for space, slotless items typically cost roughly twice what the same effect costs in a slotted item.`,
      },
      {
        heading: "Activation",
        body: `Read the activation line before you buy:

- **Use-activated:** works simply by being worn or wielded. No action.
- **Command word:** a standard action to speak; it can be countered by silence.
- **Spell completion / spell trigger:** scrolls and wands; scrolls need the spell on your class list and a caster level check if it is above you.
- **Continuous:** always on.

Activating most items provokes attacks of opportunity in melee.`,
      },
      {
        heading: "Buying and selling",
        body: `Prices are for finished items. Selling recovers about half the listed value. Charged items (wands, staffs) are priced per charge, so a partly used wand is worth proportionally less. When outfitting a new character, spend roughly half your wealth on offence, a quarter on defence, and keep a quarter for consumables and cash.`,
      },
    ],
  },
  {
    id: "items-crystals-and-sets",
    title: "Augment Crystals and Item Sets",
    category: "Magic Items",
    summary:
      "Augment crystals attach to weapons, armour and shields to add a swappable property; matched item sets grant bonus effects for wearing several pieces.",
    tags: ["magic items", "augment crystals", "sets", "upgrades"],
    sections: [
      {
        heading: "Augment crystals",
        body: `An **augment crystal** is a small attachable component that grants a weapon, armour or shield an extra property without permanently reforging it.

- Attaching or removing one is a standard action, so you can rotate crystals between fights to suit the enemy.
- Only one crystal of a given type (weapon, armour, shield) works on a given item at a time.
- Crystals come in tiers — least, lesser and greater — that require the base item to have a minimum enhancement bonus.

Typical effects: bonus damage against a creature type, energy damage, negating a monster's damage reduction, extra hardness, or resistance to a condition.`,
      },
      {
        heading: "Item sets",
        body: `A **set** is a group of themed items designed to be worn together. Owning and wearing two or more pieces unlocks additional benefits at each threshold, and the full set grants a capstone ability that no single item provides.

Sets are worth building toward when your character has a settled concept, because the pieces are only efficient together; a half-collected set is usually worse than the same gold spent on standalone gear.`,
      },
      {
        heading: "Upgrading instead of replacing",
        body: `Improving an existing item costs the difference between the old and new price. That is almost always better than buying a fresh item and selling the old one at half value, so keep your signature weapon and grow it.`,
      },
    ],
  },

  /* -------------------------------------------------------- incarnum --- */
  {
    id: "incarnum-basics",
    title: "Incarnum: Soulmelds and Essentia",
    category: "Incarnum",
    summary:
      "Incarnum users shape soulmelds each day and invest a pool of essentia into them, moving that energy around as the situation changes.",
    tags: ["incarnum", "soulmelds", "essentia"],
    sections: [
      {
        heading: "What incarnum is",
        body: `Incarnum is the raw stuff of souls, shaped into semi-real equipment and abilities. A **meldshaper** does not cast spells and does not run out of uses: instead they shape a number of **soulmelds** during a daily preparation, and those melds stay active until they are unshaped.

A soulmeld is not an object anyone can take from you; it is energy worn on part of your body.`,
      },
      {
        heading: "Essentia",
        body: `**Essentia** is a pool of points representing how much soul energy you can invest. Your pool grows with level and with certain feats.

- You can move essentia freely between soulmelds, feats and class abilities as a **swift action**, once per round.
- Each receptacle has a cap on how much essentia it can hold, based on your level.
- Investing essentia increases a meld's numbers — bonus size, damage, duration, save DC — as described in that meld's entry.

The result is a class that reconfigures itself between encounters and even between rounds, rather than spending limited resources.`,
      },
      {
        heading: "Chakra binds",
        body: `Soulmelds are shaped on **chakras**, which correspond to body locations: crown, feet, hands, arms, brow, shoulders, throat, waist, heart, soul.

Binding a soulmeld to its chakra unlocks a stronger ability but **occupies the matching magic item slot** for the day — a bound crown meld means no magic headband. Class level determines which chakras you can bind and how many binds you get, so choosing what to give up is the central tactical decision.`,
      },
      {
        heading: "The meldshaping classes",
        body: `- **Incarnate:** the generalist. Shapes the widest selection of melds, has an alignment-linked set of extra abilities, and the largest essentia pool.
- **Soulborn:** a martial character with a smaller meld list, full attack progression and smite-style strikes.
- **Totemist:** shapes melds modelled on magical beasts, favours natural attacks, and binds heavily to the totem chakra for combat forms.

Incarnum feats let any character open a small essentia pool and shape one meld, which is a cheap way to add a permanent, always-on bonus to a non-incarnum build.`,
      },
    ],
  },

  /* ------------------------------------------------ advanced options --- */
  {
    id: "options-second-wave-classes",
    title: "More Core Classes",
    category: "Advanced Options",
    summary:
      "Four widely used classes fill gaps in the original line-up: an illusion-and-charm caster, a draconic aura leader, a spell-and-sword warrior, and an armoured defender with a code.",
    tags: ["classes", "beguiler", "duskblade", "knight", "dragon shaman"],
    sections: [
      {
        heading: "The trickster caster",
        body: `An arcane caster with a **fixed spell list** focused on illusion, charm and information, cast spontaneously from a full-caster progression. Rogue-like skills, trapfinding, and the ability to cast enchantment and illusion spells that ordinarily fail against certain creatures. Play it when the party needs both a face and a scout who can also cast.`,
      },
      {
        heading: "The spell-and-sword warrior",
        body: `A medium-armour, d8 warrior with a short list of self-buffing and touch spells cast spontaneously. Its defining trick is **channelling a touch spell through a melee attack**, and at higher levels through every attack in a full attack. Simple to play, very strong in a straight fight, and weak on utility.`,
      },
      {
        heading: "The armoured defender",
        body: `A heavy-armour class that keeps enemies on itself rather than dealing top damage: a challenge that penalises opponents who ignore you, the ability to make it hard for enemies to move past you, bonus feats around mounted and shield combat, and a **code of conduct** that costs you abilities if you break it. Its value is measured in hits your allies did not take.`,
      },
      {
        heading: "The draconic aura leader",
        body: `A d10 class themed on a chosen dragon totem, projecting one **aura** at a time that benefits the whole party, plus touch healing, energy resistance, and a limited breath weapon at higher levels. It is a support frontliner: modest personal damage, real value in what it gives everyone else.`,
      },
    ],
  },
  {
    id: "options-retraining-and-rebuilding",
    title: "Retraining and Rebuilding",
    category: "Advanced Options",
    summary:
      "With the DM's agreement you can swap out feats, skill points, class features, spells known and even class levels as your character grows.",
    tags: ["retraining", "rebuild", "character options"],
    sections: [
      {
        heading: "Why retrain",
        body: `Characters change. A feat chosen at 1st level may be worthless by 9th, or a concept may drift in play. Retraining lets you correct that in-fiction rather than rerolling.`,
      },
      {
        heading: "What can be retrained",
        body: `Each time you gain a level you may retrain **one** of the following:

- a feat (the replacement must have prerequisites you still meet, and everything built on the old feat must still be legal)
- a skill's ranks, shifted to another skill within the usual maximums
- a class feature that offered a choice (a favoured enemy, a school, a bonus feat)
- a spell known, for spontaneous casters
- a language

Retraining takes time — typically a week of downtime with a teacher or practice — and the DM may require a cost or a story reason.`,
      },
      {
        heading: "Swapping a class level",
        body: `Rebuilding a whole level is a bigger step: you recalculate hit points, skills, saves and features as if you had taken the new class at that level. Do it one level at a time, keep the character's total level unchanged, and expect the DM to want an explanation the world can see — training, a vision, a new patron.`,
      },
    ],
  },
  {
    id: "options-tactical-and-teamwork-feats",
    title: "Tactical and Teamwork Feats",
    category: "Advanced Options",
    summary:
      "Tactical feats grant several named manoeuvres with set-up conditions; teamwork benefits reward a group that trains together.",
    tags: ["feats", "tactics", "teamwork"],
    sections: [
      {
        heading: "Tactical feats",
        body: `A **tactical feat** is really three feats in one. Each grants a small set of named manoeuvres, and each manoeuvre has a condition you must engineer — hit the same target twice in a round, charge from a specific position, drop a foe with a particular attack — and a reward for pulling it off.

They reward players who think a round ahead, and they are dead weight in a build that just full attacks.`,
      },
      {
        heading: "Teamwork benefits",
        body: `Teamwork benefits belong to the **group**, not the individual. The party spends training time together and gains a shared trick — moving silently as a unit, flanking more effectively, keeping formation while withdrawing. Every member must meet the requirement or the benefit does not apply, so they suit stable long-running parties.`,
      },
      {
        heading: "Choosing between them",
        body: `Take a tactical feat if you control your own positioning and can repeat a set-up reliably. Take teamwork benefits if your table plays with the same characters week after week and enjoys coordinated play. Neither substitutes for the basic combat feat chain your build needs first.`,
      },
    ],
  },
  {
    id: "options-uncommon-races-and-classes",
    title: "Uncommon Races and Classes",
    category: "Advanced Options",
    summary:
      "Beyond the core line-up sit rarer player races and specialised classes; check level adjustment and DM approval before you commit.",
    tags: ["races", "classes", "level adjustment", "options"],
    sections: [
      {
        heading: "Rarer races",
        body: `Collected supplements add player races well outside the core set — twinned souls that act as two bodies, insectile folk with unusual senses, shapechanging tricksters, beast-blooded hunters and fiend-touched outsiders.

Before choosing one, check three numbers: its **ability adjustments**, its **level adjustment** (each point sets your effective character level one higher and delays your class progression), and whether it has racial hit dice on top of that. A striking race with +2 LA is usually weaker in play than a plain human of the same experience total.`,
      },
      {
        heading: "Specialist classes",
        body: `Supplemental classes tend to be narrow: a dancer who fights unarmoured, a necromantic commander, a performer who manipulates crowds, a con artist, a jack-of-all-trades, a spirit-bargaining caster, a city-bound druid. They shine in campaigns built around their theme and struggle in generic dungeon crawls.

Ask the DM two questions before you build: does this class's theme have anything to grip in the planned campaign, and does its power sit near the classes the rest of the table is playing?`,
      },
      {
        heading: "Approval and balance",
        body: `Material outside the core books is optional by default. Bring the exact entry to the DM, note anything that looks stronger than the core equivalent, and agree in advance how it interacts with the rest of the party. It is far easier to adjust before the first session than after tenth level.`,
      },
    ],
  },
];
