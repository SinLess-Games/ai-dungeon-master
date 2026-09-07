import type { RulesetAdapter } from "@/engine";
import { DND35_RULESET_ID, DND35_RULESET_VERSION } from "./types";

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
