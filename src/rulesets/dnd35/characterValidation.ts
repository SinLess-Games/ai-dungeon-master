import { engineFailures, engineSuccess, type EngineResult } from "@engine/result";
import type { EngineIssue } from "@engine/types";
import { maximumSkillRanks, skillPointCostForRanks } from "./skills";
import {
  evaluateDnd35Prerequisite,
  type Dnd35PrerequisiteExpression,
  type Dnd35PrerequisiteFacts,
} from "./prerequisites";
import type { Dnd35Ability } from "./types";

const ABILITIES: readonly Dnd35Ability[] = ["str", "dex", "con", "int", "wis", "cha"];

export interface CharacterCreationSkillSelection {
  skillId: string;
  specialization?: string;
  ranks: number;
  classSkill: boolean;
}

export interface CharacterCreationFeatSelection {
  featId: string;
  choice?: string;
  prerequisite?: Dnd35PrerequisiteExpression;
}

export interface CharacterCreationValidationInput {
  characterLevel: number;
  raceId: string;
  classIds: readonly string[];
  abilityScores: Partial<Record<Dnd35Ability, number | null>>;
  allowNonabilities?: boolean;
  skillPointsAvailable: number;
  skills?: readonly CharacterCreationSkillSelection[];
  requiredFeatChoices: number;
  feats?: readonly CharacterCreationFeatSelection[];
  prerequisiteFacts: Dnd35PrerequisiteFacts;
  racePrerequisite?: Dnd35PrerequisiteExpression;
  classPrerequisites?: readonly { classId: string; expression: Dnd35PrerequisiteExpression }[];
}

export interface CharacterCreationValidation {
  skillPointsSpent: number;
  skillPointsRemaining: number;
  featChoicesSelected: number;
  featChoicesRequired: number;
}

function skillSelectionKey(selection: CharacterCreationSkillSelection): string {
  return `${selection.skillId}:${selection.specialization ?? ""}`;
}

function prerequisiteIssues(
  expression: Dnd35PrerequisiteExpression,
  facts: Dnd35PrerequisiteFacts,
  pathPrefix: string,
): EngineIssue[] {
  const evaluation = evaluateDnd35Prerequisite(expression, facts);
  return evaluation.failures.map((failure) => ({
    code: "DND35_PREREQUISITE_FAILED",
    message: failure.message,
    path: `${pathPrefix}.${failure.path}`,
  }));
}

/** Validate the deterministic choices required to finalize a character build. */
export function validateCharacterCreation(
  input: CharacterCreationValidationInput,
): EngineResult<CharacterCreationValidation> {
  const errors: EngineIssue[] = [];

  if (!Number.isSafeInteger(input.characterLevel) || input.characterLevel < 1) {
    throw new RangeError("Character level must be a positive safe integer.");
  }
  if (!input.raceId.trim()) errors.push({ code: "DND35_RACE_REQUIRED", message: "A race must be selected.", path: "raceId" });
  if (input.classIds.length === 0 || input.classIds.some((classId) => !classId.trim())) {
    errors.push({ code: "DND35_CLASS_REQUIRED", message: "At least one valid class must be selected.", path: "classIds" });
  }

  for (const ability of ABILITIES) {
    const score = input.abilityScores[ability];
    if (score === undefined) {
      errors.push({
        code: "DND35_ABILITY_REQUIRED",
        message: `${ability.toUpperCase()} must be assigned.`,
        path: `abilityScores.${ability}`,
      });
      continue;
    }
    if (score === null) {
      if (!input.allowNonabilities) {
        errors.push({
          code: "DND35_NONABILITY_NOT_ALLOWED",
          message: `${ability.toUpperCase()} cannot be a nonability for this character.`,
          path: `abilityScores.${ability}`,
        });
      }
      continue;
    }
    if (!Number.isSafeInteger(score) || score < 0) {
      errors.push({
        code: "DND35_ABILITY_INVALID",
        message: `${ability.toUpperCase()} must be a non-negative integer.`,
        path: `abilityScores.${ability}`,
      });
    }
  }

  if (!Number.isSafeInteger(input.skillPointsAvailable) || input.skillPointsAvailable < 0) {
    throw new RangeError("Available skill points must be a non-negative safe integer.");
  }

  const seenSkills = new Set<string>();
  let skillPointsSpent = 0;
  for (const [index, skill] of (input.skills ?? []).entries()) {
    if (!skill.skillId.trim()) {
      errors.push({ code: "DND35_SKILL_INVALID", message: "Skill id cannot be empty.", path: `skills[${index}]` });
      continue;
    }
    const key = skillSelectionKey(skill);
    if (seenSkills.has(key)) {
      errors.push({ code: "DND35_SKILL_DUPLICATE", message: `Skill ${key} was selected more than once.`, path: `skills[${index}]` });
      continue;
    }
    seenSkills.add(key);

    try {
      const maximum = maximumSkillRanks(input.characterLevel, skill.classSkill);
      if (skill.ranks > maximum) {
        errors.push({
          code: "DND35_SKILL_RANK_CAP",
          message: `${skill.skillId} exceeds the ${maximum}-rank maximum.`,
          path: `skills[${index}].ranks`,
        });
      }
      skillPointsSpent += skillPointCostForRanks(skill.ranks, skill.classSkill);
    } catch (error) {
      errors.push({
        code: "DND35_SKILL_RANK_INVALID",
        message: error instanceof Error ? error.message : "Invalid skill ranks.",
        path: `skills[${index}].ranks`,
      });
    }
  }

  if (skillPointsSpent > input.skillPointsAvailable) {
    errors.push({
      code: "DND35_SKILL_POINTS_EXCEEDED",
      message: `The build spends ${skillPointsSpent} skill points but only ${input.skillPointsAvailable} are available.`,
      path: "skills",
    });
  }

  if (!Number.isSafeInteger(input.requiredFeatChoices) || input.requiredFeatChoices < 0) {
    throw new RangeError("Required feat choices must be a non-negative safe integer.");
  }
  const feats = input.feats ?? [];
  const seenFeats = new Set<string>();
  for (const [index, feat] of feats.entries()) {
    if (!feat.featId.trim()) {
      errors.push({ code: "DND35_FEAT_INVALID", message: "Feat id cannot be empty.", path: `feats[${index}]` });
      continue;
    }
    const key = `${feat.featId}:${feat.choice ?? ""}`;
    if (seenFeats.has(key)) {
      errors.push({ code: "DND35_FEAT_DUPLICATE", message: `Feat ${feat.featId} was selected more than once.`, path: `feats[${index}]` });
    }
    seenFeats.add(key);
    if (feat.prerequisite) {
      errors.push(...prerequisiteIssues(feat.prerequisite, input.prerequisiteFacts, `feats[${index}].prerequisite`));
    }
  }

  if (feats.length !== input.requiredFeatChoices) {
    errors.push({
      code: "DND35_FEAT_CHOICE_COUNT",
      message: `The build requires ${input.requiredFeatChoices} feat choices but has ${feats.length}.`,
      path: "feats",
    });
  }

  if (input.racePrerequisite) {
    errors.push(...prerequisiteIssues(input.racePrerequisite, input.prerequisiteFacts, "racePrerequisite"));
  }
  for (const [index, prerequisite] of (input.classPrerequisites ?? []).entries()) {
    errors.push(
      ...prerequisiteIssues(
        prerequisite.expression,
        input.prerequisiteFacts,
        `classPrerequisites[${index}]:${prerequisite.classId}`,
      ),
    );
  }

  if (errors.length > 0) return engineFailures(errors);
  return engineSuccess({
    skillPointsSpent,
    skillPointsRemaining: input.skillPointsAvailable - skillPointsSpent,
    featChoicesSelected: feats.length,
    featChoicesRequired: input.requiredFeatChoices,
  });
}
