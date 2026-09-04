import type { WikiArticle } from "./dm-guide";

/**
 * Player-facing Leadership article. The numeric table itself is rendered
 * interactively from src/lib/rules/leadership.ts.
 */

export const LEADERSHIP_CATEGORIES = ["Leadership"] as const;

export const LEADERSHIP_ARTICLES: WikiArticle[] = [
  {
    id: "leadership-followers",
    title: "Leadership, Cohorts and Followers",
    category: "Leadership",
    summary:
      "Work out your Leadership score, the level of the cohort it attracts, and how many followers of each level answer your call — standard and epic.",
    tags: ["leadership", "cohort", "followers", "epic"],
    sections: [
      {
        heading: "Your Leadership score",
        body: `Leadership is a feat available from 6th level. Your **Leadership score** is your character level + your Charisma modifier, then adjusted by how you behave:

- **Reputation:** a great renown, a stronghold, or a famous deed adds +1 or +2.
- **Fairness and generosity:** +1. **Failing to pay or share:** –1.
- **Special power** (extraordinary abilities, a fearsome mount): +1.
- **Cruelty, recklessness with followers' lives, or a follower dying:** –1 or –2 each, and the losses stick.
- Having a familiar, special mount, or animal companion is usually –2 for the cohort only.

Aim high deliberately: every point of score is worth a noticeable jump in the numbers below.`,
      },
      {
        heading: "Cohorts",
        body: `Your cohort is a single loyal companion whose level comes from the table. Rules of thumb:

- A cohort is always at least **two levels below you**; the table result is capped at that.
- The cohort earns experience as a party member but does not count for dividing treasure the way a full player character does.
- Replacing a lost cohort takes time, and losing one costs you Leadership score.
- A cohort can be any class or, with the DM's agreement, a creature of the equivalent effective level.`,
      },
      {
        heading: "Followers",
        body: `Followers are the rank and file: they do not gain experience, they do not adventure with you as equals, and they are typically 1st-level warriors, experts and commoners at the low end of the table.

Use them for garrisons, crews, workshops, temples, spy networks and armies. The higher-level entries in the table are lieutenants — sergeants, captains, master crafters — not front-line adventurers. If followers die because of your choices, your Leadership score drops and the whole table shifts down.`,
      },
      {
        heading: "Epic Leadership",
        body: `At a Leadership score of 26 or higher the ordinary table runs out and epic leadership takes over: cohort levels keep climbing, and follower numbers grow roughly by a fixed step each point of score, with each higher follower level holding about half as many people as the one below it.

At those scores you are no longer recruiting a retinue — you are running a settlement, an order, or an army. The table below runs all the way to a score of 313.`,
      },
      {
        heading: "Using the table",
        body: `Set your Leadership score in the calculator below to see the cohort level and the exact follower spread. The totals line is what you can actually field if you call everyone up at once.`,
      },
    ],
  },
];
