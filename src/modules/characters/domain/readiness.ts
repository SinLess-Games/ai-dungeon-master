import { engineFailures, engineSuccess, type EngineIssue, type EngineResult } from "@/engine";
import type { Dnd35Ability } from "@/rulesets/dnd35";

const ABILITIES: readonly Dnd35Ability[] = ["str", "dex", "con", "int", "wis", "cha"];

export interface Dnd35CharacterReadinessFacts {
  extensionPresent: boolean;
  raceId: string | null;
  abilityScores: Partial<Record<Dnd35Ability, number | null>>;
  classLevelCount: number;
}

/**
 * Application-level completeness gate for a normal playable D&D 3.5 PC.
 *
 * This does not replace the ruleset validator. It prevents obviously partial
 * drafts from being promoted to `ready`; the full D&D validator remains the
 * authority for prerequisites, skill budgets, feat choices, and other rules.
 */
export function validateDnd35CharacterReadiness(
  facts: Dnd35CharacterReadinessFacts,
): EngineResult<void> {
  const issues: EngineIssue[] = [];

  if (!facts.extensionPresent) {
    issues.push({
      code: "DND35_CHARACTER_EXTENSION_REQUIRED",
      message: "D&D 3.5 character data has not been created yet.",
      path: "dnd35",
    });
  }

  if (!facts.raceId?.trim()) {
    issues.push({
      code: "DND35_CHARACTER_RACE_REQUIRED",
      message: "Select a race before marking the character ready.",
      path: "dnd35.raceId",
    });
  }

  for (const ability of ABILITIES) {
    const score = facts.abilityScores[ability];
    if (score === undefined || score === null) {
      issues.push({
        code: "DND35_CHARACTER_ABILITY_REQUIRED",
        message: `${ability.toUpperCase()} must have a base score for a playable character.`,
        path: `dnd35.abilityScores.${ability}`,
      });
    }
  }

  if (!Number.isSafeInteger(facts.classLevelCount) || facts.classLevelCount < 1) {
    issues.push({
      code: "DND35_CHARACTER_CLASS_LEVEL_REQUIRED",
      message: "At least one class level is required before the character can be ready.",
      path: "dnd35.classLevels",
    });
  }

  return issues.length > 0 ? engineFailures(issues) : engineSuccess(undefined);
}
