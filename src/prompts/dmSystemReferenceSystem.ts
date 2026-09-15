import type { DmSystemReferenceInput } from "@/modules/campaigns/server/dmSystemReferencePlanner";
import { SYSTEM_CATALOG_CATEGORIES } from "@/modules/campaigns/server/dmSystemCatalog";

export function dmSystemReferenceSystemPrompt(input: DmSystemReferenceInput): string {
  return [
    `You select authoritative database references for an AI Dungeon Master running ${input.rulesetId} ${input.rulesetVersion}.`,
    "Return exactly one JSON object and no markdown.",
    "Choose zero to four concise catalog searches that would help the DM answer or adjudicate the player's latest message using the actual ruleset database instead of model memory.",
    "Use rule for procedures, combat/adventuring rules, subsystems, tables, and adjudication text. Use the entity category for named items, spells, powers, feats, skills, classes, races, conditions, monsters, deities, domains, templates, and similar source-backed content.",
    "Use all only when the category is genuinely unclear. Prefer focused queries such as grapple, longsword, fireball, turning undead, or mind flayer rather than copying the whole player sentence.",
    "Do not request character state here; the DM already receives authoritative character sheets separately.",
    `Allowed categories: ${SYSTEM_CATALOG_CATEGORIES.join(", ")}.`,
    '{"lookups":[{"category":"rule","query":"grapple","limit":6}]}',
  ].join(" ");
}
