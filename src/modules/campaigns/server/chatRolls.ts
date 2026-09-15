/// <reference types="@cloudflare/workers-types" />

import { createDatabase } from "@/infrastructure/database/client";
import { loadSkillActionSnapshot } from "@/modules/game/server/d1Dnd35State";
import { loadDmCharacterContext, type DmCharacterContext } from "./dmActionService";

export interface ParsedDiceExpression {
  count: number;
  sides: number;
  modifier: number;
  canonical: string;
}

export interface ResolvedInlineRoll {
  token: string;
  kind: "dice" | "skill";
  label: string;
  rolls: number[];
  modifier: number;
  total: number;
  skillId?: string;
  specialization?: string;
}

export interface InlineRollResolution {
  content: string;
  rolls: ResolvedInlineRoll[];
}

const INLINE_ROLL_TOKEN = /\{([^{}\n]{1,120})\}/g;
const DICE_EXPRESSION = /^(\d{1,3})\s*d\s*(\d{1,4})(?:\s*([+-])\s*(\d{1,6}))?$/i;
const MAX_INLINE_ROLLS = 12;

function normalizeSkillSelector(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function parseDiceExpression(value: string): ParsedDiceExpression | null {
  const match = DICE_EXPRESSION.exec(value.trim());
  if (!match) return null;
  const count = Number(match[1]);
  const sides = Number(match[2]);
  const magnitude = match[4] ? Number(match[4]) : 0;
  const modifier = match[3] === "-" ? -magnitude : magnitude;

  if (!Number.isSafeInteger(count) || count < 1 || count > 100) {
    throw new Error("Dice expressions must roll between 1 and 100 dice.");
  }
  if (!Number.isSafeInteger(sides) || sides < 2 || sides > 10_000) {
    throw new Error("Dice expressions must use dice with 2 to 10,000 sides.");
  }
  if (!Number.isSafeInteger(modifier) || Math.abs(modifier) > 1_000_000) {
    throw new Error("Dice modifiers must be between -1,000,000 and +1,000,000.");
  }

  return {
    count,
    sides,
    modifier,
    canonical: `${count}d${sides}${modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : modifier}`,
  };
}

function randomDie(sides: number): number {
  // Rejection sampling avoids modulo bias while remaining compatible with
  // Workers/WebCrypto. 2^32 is exactly representable as a JS number.
  const range = 0x1_0000_0000;
  const ceiling = Math.floor(range / sides) * sides;
  const buffer = new Uint32Array(1);
  let value = range;
  while (value >= ceiling) {
    crypto.getRandomValues(buffer);
    value = buffer[0]!;
  }
  return (value % sides) + 1;
}

function skillAliases(skill: DmCharacterContext["skills"][number]): string[] {
  const aliases = [skill.name];
  if (skill.specialization) {
    aliases.push(`${skill.name} (${skill.specialization})`, `${skill.name} ${skill.specialization}`);
  }
  return aliases.map(normalizeSkillSelector);
}

export function matchInlineSkill(
  skills: readonly DmCharacterContext["skills"][number][],
  selector: string,
): DmCharacterContext["skills"][number] | null {
  const normalized = normalizeSkillSelector(selector);
  const exact = skills.filter((skill) => skillAliases(skill).includes(normalized));
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) {
    const options = exact
      .map((skill) => `${skill.name}${skill.specialization ? ` (${skill.specialization})` : ""}`)
      .join(", ");
    throw new Error(`That skill name is ambiguous. Use one of: ${options}.`);
  }
  return null;
}

function formatModifier(modifier: number): string {
  if (modifier === 0) return "";
  return modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
}

function formatResolvedRoll(result: ResolvedInlineRoll): string {
  const rolled = result.rolls.length === 1 ? String(result.rolls[0]) : `[${result.rolls.join(", ")}]`;
  return `🎲 **${result.label}**: ${rolled}${formatModifier(result.modifier)} = **${result.total}**`;
}

/**
 * Resolves brace-delimited rolls before a campaign message is persisted.
 *
 * Supported forms:
 * - `{Spot}` / `{Knowledge (arcana)}`: authoritative current character skill modifier.
 * - `{1d20+8}` / `{2d6 - 1}`: server-side dice expression.
 *
 * Skill rolls deliberately do not invent a DC or success/failure. They provide
 * a trustworthy total that the DM may consume in the same message. DM-requested
 * checks still use the pending-check workflow where the rules engine owns the DC.
 */
export async function resolveCampaignInlineRolls(input: {
  binding: D1Database;
  campaignId: string;
  characterId: string | null;
  userId: string;
  content: string;
}): Promise<InlineRollResolution> {
  const matches = [...input.content.matchAll(INLINE_ROLL_TOKEN)];
  if (matches.length === 0) return { content: input.content, rolls: [] };
  if (matches.length > MAX_INLINE_ROLLS) {
    throw new Error(`A message may contain at most ${MAX_INLINE_ROLLS} inline rolls.`);
  }

  let characterContext: DmCharacterContext | null | undefined;
  const db = createDatabase(input.binding);
  const resolved: ResolvedInlineRoll[] = [];
  let cursor = 0;
  const parts: string[] = [];

  for (const match of matches) {
    const full = match[0];
    const token = match[1]!.trim();
    const index = match.index ?? 0;
    parts.push(input.content.slice(cursor, index));

    const dice = parseDiceExpression(token);
    if (dice) {
      const rolls = Array.from({ length: dice.count }, () => randomDie(dice.sides));
      const total = rolls.reduce((sum, roll) => sum + roll, 0) + dice.modifier;
      const result: ResolvedInlineRoll = {
        token,
        kind: "dice",
        label: dice.canonical,
        rolls,
        modifier: dice.modifier,
        total,
      };
      resolved.push(result);
      parts.push(formatResolvedRoll(result));
      cursor = index + full.length;
      continue;
    }

    if (!input.characterId) {
      throw new Error(
        `Unknown roll token {${token}}. Skill-name rolls require a controlled campaign character; dice rolls use forms such as {1d20+8}.`,
      );
    }
    if (characterContext === undefined) {
      characterContext = await loadDmCharacterContext(
        input.binding,
        input.campaignId,
        input.characterId,
        input.userId,
      );
    }
    if (!characterContext) {
      throw new Error("The selected character is not available for an inline skill roll.");
    }

    const skill = matchInlineSkill(characterContext.skills, token);
    if (!skill) {
      throw new Error(
        `Unknown roll token {${token}}. Use an exact character skill name such as {Spot}, or a dice expression such as {1d20+8}.`,
      );
    }
    const snapshot = await loadSkillActionSnapshot({
      db,
      campaignId: input.campaignId,
      characterId: input.characterId,
      skillId: skill.id,
      ...(skill.specialization ? { specialization: skill.specialization } : {}),
    });
    if (!snapshot) throw new Error(`The ${skill.name} skill is unavailable for this character.`);
    if (snapshot.trainedOnly && snapshot.ranks <= 0) {
      throw new Error(`${skill.name} is trained-only and this character has no ranks in it.`);
    }

    const natural = randomDie(20);
    const modifier = snapshot.ranks + snapshot.abilityModifier + snapshot.armorCheckPenalty;
    const total = natural + modifier;
    const label = `${skill.name}${skill.specialization ? ` (${skill.specialization})` : ""}`;
    const result: ResolvedInlineRoll = {
      token,
      kind: "skill",
      label,
      rolls: [natural],
      modifier,
      total,
      skillId: skill.id,
      ...(skill.specialization ? { specialization: skill.specialization } : {}),
    };
    resolved.push(result);
    parts.push(formatResolvedRoll(result));
    cursor = index + full.length;
  }

  parts.push(input.content.slice(cursor));
  return { content: parts.join(""), rolls: resolved };
}
