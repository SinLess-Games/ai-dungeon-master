import type { WikiArticle } from "./dm-guide";

/**
 * Player-facing reference for arcane techniques, luck and trickery, martial
 * training, and expanded psionics. Original summaries of mechanics only.
 */

export const EXPANSION6_CATEGORIES = [
  "Arcane Options",
  "Skill & Stealth Options",
  "Martial Options",
  "Psionics",
] as const;

export const EXPANSION6_ARTICLES: WikiArticle[] = [
  {
    id: "arcane-magic-styles",
    title: "Styles of arcane magic",
    category: "Arcane Options",
    summary:
      "Spell-like feats for non-casters, reserve magic, arcane channelling into weapons, and traditions that change how you cast rather than what you cast.",
    tags: ["arcane", "reserve", "channelling", "traditions", "mage"],
    sections: [
      {
        heading: "Magic for characters who don't cast",
        body: `Several feat families let a fighter, rogue or ranger touch arcane power without spell slots:

- **Item-based feats** that let you use wands, scrolls or staves you could not otherwise activate, or that improve Use Magic Device.
- **Once-per-day spell-like feats** granting a single low-level effect at your character level.
- **Bloodline feats** representing distant sorcerous ancestry, unlocking a minor at-will cantrip-style effect.

None of these make you a caster: they do not stack toward caster level for prestige classes, and they can be dispelled and suppressed like any magic.`,
      },
      {
        heading: "Reserve magic and channelling",
        body: `**Reserve feats** stay active while you keep an unused spell of the matching school and level; they give a weaker, at-will version of that school's effect and shut off the moment the reserve spell is spent.

**Arcane channelling** converts a held spell into a weapon strike: you cast a touch spell and deliver it through a melee attack, or sacrifice a slot to add damage, a rider condition, or a bonus to the attack. The pattern rewards gishes — characters who mix casting with melee — because a slot never goes to waste on a round you swing.`,
      },
      {
        heading: "Traditions and casting variants",
        body: `Options that change delivery rather than the spell list:

- Casting a spell as a **swift** action once per day.
- Trading a familiar or a bonus feat for a permanent minor ability.
- Substituting Concentration for a defence, or casting quietly at a penalty rather than needing a feat.
- Rituals that take minutes and several participants but cost fewer resources than a full slot.

Each has a price: fewer slots, longer casting, or a permanent commitment. Pick one identity and build around it instead of collecting all of them.`,
      },
    ],
  },
  {
    id: "luck-and-trickery",
    title: "Luck, tricks and dirty fighting",
    category: "Skill & Stealth Options",
    summary:
      "Luck feats and rerolls, skill tricks in combat, ambush tactics, feints, and gambits that trade risk for a decisive edge.",
    tags: ["luck", "rogue", "feint", "ambush", "scoundrel"],
    sections: [
      {
        heading: "Luck feats and rerolls",
        body: `A **luck feat** gives you a small pool of rerolls per day. Taking one luck feat unlocks a daily reroll; each further luck feat both adds a new specific use (reroll a save, a skill check, a damage roll) and increases the pool.

You must accept the second result, and you can only reroll once per roll. Luck is the answer to "the one roll that mattered" — save it for a save-or-die, not a damage die.`,
      },
      {
        heading: "Tricks in a fight",
        body: `- **Feint** — a Bluff check against the enemy's Sense Motive to deny them their Dexterity bonus for your next attack, which is how a rogue gets sneak attack one-on-one. Normally a standard action; feats make it faster.
- **Dirty tactics** — throwing sand, cutting a purse mid-combat, tumbling between legs, or using an ally as cover; most are opposed checks resolved as standard or move actions.
- **Ambush** — success comes from winning the surprise round: stealth to get in place, initiative to act first, and a burst of damage before the enemy is no longer flat-footed.
- **Gambits** — high-risk manoeuvres that grant a big bonus if a check succeeds and leave you exposed if it fails. Use them when the fight is already going badly.`,
      },
      {
        heading: "Sneak attack, precision and its limits",
        body: `Precision damage applies when the target is flat-footed, flanked, or otherwise denied Dexterity, and only within 30 feet for ranged attacks.

It does not apply to creatures immune to critical hits (constructs, elementals, oozes, plants, undead, swarms), to targets with concealment, or through total cover. Carry a backup plan — a weapon with a rider effect, alchemical splash items, or a way to grant yourself concealment — for the fights where precision is off the table.`,
      },
    ],
  },
  {
    id: "martial-options",
    title: "Martial training and combat styles",
    category: "Martial Options",
    summary:
      "Fighting styles, weapon and shield options, mounted and two-weapon builds, and the tactical feats that reward specific manoeuvres.",
    tags: ["fighter", "combat", "feats", "styles", "warrior"],
    sections: [
      {
        heading: "Building a style",
        body: `Most martial builds follow a chain: a feat that opens the style, one that improves it, and one that adds a special manoeuvre.

- **Two-handed power** — Power Attack into cleaving and shattering follow-ups; every point traded for damage counts double.
- **Sword and board** — shield feats that let you keep your shield bonus while bashing, or use the shield to protect an adjacent ally.
- **Two-weapon** — high Dexterity, then feats that add extra attacks, defence, or rend damage when both weapons hit.
- **Ranged** — rapid shot and precise shot first, then feats that pin, disarm or knock down at range.
- **Mounted** — a strong mount, ride-by attack and spirited charge for a devastating single pass.
- **Unarmed and grapple** — improved grapple and its follow-ups so you never provoke and can control a caster completely.`,
      },
      {
        heading: "Tactical feats",
        body: `A **tactical feat** grants three named manoeuvres, each usable when you meet a specific condition — hitting the same foe twice in a round, moving before you attack, or defending an ally. Each manoeuvre may usually be used once per encounter.

They ask you to plan a round ahead, and they reward positioning far more than raw attack bonus.`,
      },
      {
        heading: "Combat manoeuvres worth knowing",
        body: `- **Trip** — a touch attack then an opposed Strength check; a prone enemy takes −4 to melee attacks and grants +4 to yours.
- **Disarm** — opposed attack rolls with size and two-handed modifiers; risky without the improved feat.
- **Bull rush and overrun** — move an enemy off a ledge, out of a chokepoint, or away from your caster.
- **Sunder** — destroy the weapon or shield making the fight hard.
- **Fighting defensively / total defence** — trade attack for AC when you need to survive one more round.

Each of these provokes an attack of opportunity without the matching Improved feat, which is why those feats define whether a build can use them at all.`,
      },
    ],
  },
  {
    id: "psionics-expanded",
    title: "Expanded psionic options",
    category: "Psionics",
    summary:
      "Psionic focus, power points and augmentation, psionic feats and items, and how psionics interacts with magic at the table.",
    tags: ["psionics", "power points", "focus", "manifesting"],
    sections: [
      {
        heading: "Psionic focus",
        body: `Spend a full-round action and make a DC 20 Concentration check to become **psionically focused**. While focused you gain access to psionic feats; expending the focus fuels their effects, and you must re-earn it afterwards.

Some abilities let you maintain multiple focuses or regain one as a move action — a major upgrade, because most psionic feat chains cost a focus per use.`,
      },
      {
        heading: "Power points and augmentation",
        body: `Manifesters have a single pool of power points rather than slots. Nearly every power can be **augmented**: spend extra points to increase damage, duration, targets or save DC.

Hard limit: you can never spend more points on a single power than your manifester level. That cap is what keeps low-level manifesters from dumping their whole pool into one attack, and it means your effective power grows steadily rather than in jumps.`,
      },
      {
        heading: "Displays, feats and items",
        body: `Manifesting produces **displays** — visual, auditory, mental, material or olfactory signs. They give away that you are using a power unless you take a feat or ability to suppress them.

Psionic feats generally cost your focus for a burst effect: extra damage, a reroll, a defensive boost, or a faster manifest. Psionic items include cognizance crystals (stored power points), dorjes (wand equivalents), power stones (scroll equivalents) and psicrowns.`,
      },
      {
        heading: "Psionics and magic together",
        body: `The default assumption is **transparency**: psionics and magic affect each other normally. Spell resistance stops powers, power resistance stops spells, *dispel magic* dispels powers, and protective effects apply to both.

If your table turns transparency off, psionics becomes a separate system that most magical defences ignore — powerful, and worth agreeing on before the campaign starts.`,
      },
    ],
  },
];
