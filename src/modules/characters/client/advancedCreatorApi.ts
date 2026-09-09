import {
  requestJson,
  type AbilityGenerationMethod,
  type AbilityKey,
  type Alignment,
  type ClassOption,
  type EquipmentPage,
  type ProgressionMode,
  type StartingWealthFormula,
} from "./creatorApi";

export interface GestaltWealthFormula {
  track: number;
  classId: string;
  classSlug: string;
  className: string;
  formula: StartingWealthFormula;
}

export interface AdvancedEquipmentPage extends EquipmentPage {
  classes?: Array<{ track: number; id: string; slug: string; name: string }>;
  classFormulas?: GestaltWealthFormula[];
  wealthRule?: string;
}

const characterPath = (characterId: string, suffix = "") =>
  `/api/characters/${encodeURIComponent(characterId)}${suffix}`;

export async function createAdvancedCharacterFoundation(input: {
  campaignId: string;
  name: string;
  pronouns?: string;
  playerNotes?: string;
  raceId: string;
  alignment: Alignment;
  abilities: Record<AbilityKey, number>;
  characterClass: ClassOption;
  secondaryClass?: ClassOption;
  progressionMode: ProgressionMode;
  abilityGenerationMethod: AbilityGenerationMethod;
}): Promise<{ characterId: string }> {
  const selectedClasses = [
    input.characterClass,
    ...(input.progressionMode === "gestalt" && input.secondaryClass ? [input.secondaryClass] : []),
  ];
  if (input.progressionMode === "gestalt" && !input.secondaryClass) {
    throw new Error("Choose both gestalt classes.");
  }
  if (input.secondaryClass?.id === input.characterClass.id) {
    throw new Error("A gestalt character must choose two different classes.");
  }
  for (const characterClass of selectedClasses) {
    if (!characterClass.allowedAlignments.includes(input.alignment)) {
      throw new Error(
        characterClass.prerequisiteExplanation ??
          `${characterClass.name} does not allow the selected alignment.`,
      );
    }
    if (!characterClass.startingWealth) {
      throw new Error(`${characterClass.name} is missing a starting-wealth formula.`);
    }
  }

  const character = await requestJson<{ id: string }>(
    `/api/campaigns/${encodeURIComponent(input.campaignId)}/characters`,
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        metadata: {
          ...(input.pronouns ? { pronouns: input.pronouns } : {}),
          ...(input.playerNotes ? { playerNotes: input.playerNotes } : {}),
          extensions: {
            creatorVersion: 3,
            creationMethod: input.abilityGenerationMethod,
            progressionMode: input.progressionMode,
          },
        },
      }),
    },
  );

  await requestJson(characterPath(character.id), {
    method: "PATCH",
    body: JSON.stringify({ raceId: input.raceId, alignment: input.alignment }),
  });
  await requestJson(characterPath(character.id, "/creation/abilities"), {
    method: "PUT",
    body: JSON.stringify({ method: input.abilityGenerationMethod, scores: input.abilities }),
  });
  await requestJson(characterPath(character.id, "/progression-mode"), {
    method: "PUT",
    body: JSON.stringify({ mode: input.progressionMode }),
  });
  await requestJson(characterPath(character.id, "/class-levels"), {
    method: "POST",
    body: JSON.stringify({
      classLevelId: input.characterClass.classLevelId,
      hitPointsGained: input.characterClass.firstLevelHitPoints,
      skillPointsSpent: 0,
      track: 1,
    }),
  });
  if (input.progressionMode === "gestalt" && input.secondaryClass) {
    await requestJson(characterPath(character.id, "/class-levels"), {
      method: "POST",
      body: JSON.stringify({
        classLevelId: input.secondaryClass.classLevelId,
        hitPointsGained: input.secondaryClass.firstLevelHitPoints,
        skillPointsSpent: 0,
        track: 2,
      }),
    });
  }
  return { characterId: character.id };
}

export const getAdvancedEquipment = (characterId: string) =>
  requestJson<AdvancedEquipmentPage>(characterPath(characterId, "/creation/equipment"));
