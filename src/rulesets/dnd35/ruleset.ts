import type { RulesetAdapter } from "@/engine";

export const DND35_RULESET_ID = "dnd35";
export const DND35_RULESET_VERSION = "3.5";

export const dnd35Ruleset: RulesetAdapter = {
  descriptor: {
    id: DND35_RULESET_ID,
    version: DND35_RULESET_VERSION,
    name: "Dungeons & Dragons 3.5",
    capabilities: [
      "abilities",
      "classes",
      "races",
      "feats",
      "skills",
      "combat",
      "conditions",
      "equipment",
      "spellcasting",
      "psionics",
      "advancement",
      "character-creation",
    ],
  },
};
