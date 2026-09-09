import { readFileSync, writeFileSync } from "node:fs";

function replaceTarget(path, oldText, newText) {
  const text = readFileSync(path, "utf8");
  if (text.includes(oldText)) {
    writeFileSync(path, text.replace(oldText, newText));
    return;
  }
  if (!text.includes(newText)) {
    throw new Error(`Neither old nor repaired text found in ${path}`);
  }
}

replaceTarget(
  "src/modules/characters/server/featCreationRoutes.ts",
  '      spellLevelAccess: spellAccess as Dnd35PrerequisiteFacts["spellLevelAccess"],',
  "      spellLevelAccess: spellAccess,",
);

const ui = "src/modules/characters/ui/AdvancedCharacterCreator.tsx";
replaceTarget(
  ui,
  "  type FeatSelection,\n  type PointBuyBudget,",
  "  type FeatSelection,\n  type LanguageOption,\n  type PointBuyBudget,",
);
replaceTarget(
  ui,
  [
    "    options: data.options,",
    "    schools: data.schools,",
    "    generalistAllowed: data.generalistAllowed,",
    "    subtypeRequiredFor: data.subtypeRequiredFor,",
    "    subtypeOptions: data.subtypeOptions,",
  ].join("\n"),
  [
    "    ...(data.options !== undefined ? { options: data.options } : {}),",
    "    ...(data.schools !== undefined ? { schools: data.schools } : {}),",
    "    ...(data.generalistAllowed !== undefined ? { generalistAllowed: data.generalistAllowed } : {}),",
    "    ...(data.subtypeRequiredFor !== undefined ? { subtypeRequiredFor: data.subtypeRequiredFor } : {}),",
    "    ...(data.subtypeOptions !== undefined ? { subtypeOptions: data.subtypeOptions } : {}),",
  ].join("\n"),
);
replaceTarget(
  ui,
  "  const all = page.data?.allOptions ?? [",
  "  const all: LanguageOption[] = page.data?.allOptions ?? [",
);
replaceTarget(
  ui,
  '  return data.sections ?? [{ track: data.track ?? 1, classId: data.classId ?? "", className: data.className ?? "Class", required: data.required, mode: data.mode, automaticSpellIds: data.automaticSpellIds, firstLevelChoicesRequired: data.firstLevelChoicesRequired, specialization: data.specialization, knownByLevel: data.knownByLevel, options: data.options, selected: data.selected }];',
  [
    "  return data.sections ?? [{",
    "    track: data.track ?? 1,",
    '    classId: data.classId ?? "",',
    '    className: data.className ?? "Class",',
    "    required: data.required,",
    "    mode: data.mode,",
    "    ...(data.automaticKnown !== undefined ? { automaticKnown: data.automaticKnown } : {}),",
    "    ...(data.automaticSpellIds !== undefined ? { automaticSpellIds: data.automaticSpellIds } : {}),",
    "    ...(data.firstLevelChoicesRequired !== undefined ? { firstLevelChoicesRequired: data.firstLevelChoicesRequired } : {}),",
    "    ...(data.specialization !== undefined ? { specialization: data.specialization } : {}),",
    "    ...(data.knownByLevel !== undefined ? { knownByLevel: data.knownByLevel } : {}),",
    "    options: data.options,",
    "    selected: data.selected,",
    "  }];",
  ].join("\n"),
);
replaceTarget(
  ui,
  '  return data.sections ?? [{ track: data.track ?? 1, classId: data.classId ?? "", className: data.className ?? "Class", required: data.required, count: data.count, maximumPowerLevel: data.maximumPowerLevel ?? 0, disciplineId: data.disciplineId, options: data.options, selected: data.selected }];',
  [
    "  return data.sections ?? [{",
    "    track: data.track ?? 1,",
    '    classId: data.classId ?? "",',
    '    className: data.className ?? "Class",',
    "    required: data.required,",
    "    count: data.count,",
    "    maximumPowerLevel: data.maximumPowerLevel ?? 0,",
    "    ...(data.disciplineId !== undefined ? { disciplineId: data.disciplineId } : {}),",
    "    options: data.options,",
    "    selected: data.selected,",
    "  }];",
  ].join("\n"),
);
