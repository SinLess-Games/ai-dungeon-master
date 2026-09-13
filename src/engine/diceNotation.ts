import { parseDiceExpression, rollDie } from "@/engine/dice";
import { mathRandomSource, type RandomSource } from "@/engine/random";

export const diceNotationLimits = {
  maxLength: 256,
  maxTerms: 50,
  maxDice: 1_000,
  minSides: 2,
  maxSides: 1_000,
  maxModifier: 1_000_000_000,
} as const;

export type DiceNotationTerm =
  | { kind: "dice"; sign: 1 | -1; count: number; sides: number }
  | { kind: "modifier"; sign: 1 | -1; value: number };

export interface ParsedDiceNotation {
  notation: string;
  terms: readonly DiceNotationTerm[];
  diceCount: number;
  minimum: number;
  maximum: number;
}

export type RolledDiceTerm = DiceNotationTerm & {
  rolls: readonly number[];
  subtotal: number;
};

export interface DiceNotationResult {
  notation: string;
  terms: readonly RolledDiceTerm[];
  total: number;
}

export function formatDiceTerm(term: DiceNotationTerm): string {
  return term.kind === "dice" ? `${term.count}d${term.sides}` : String(term.value);
}

/** Parse dice groups and integer modifiers joined by + or -, without evaluating code. */
export function parseDiceNotation(input: string): ParsedDiceNotation {
  if (input.length > diceNotationLimits.maxLength) {
    throw new RangeError(
      `Keep expressions to ${diceNotationLimits.maxLength} characters or fewer.`,
    );
  }
  let remaining = input.trim();
  if (!remaining) throw new SyntaxError("Enter a dice expression, such as 1d20+4-8.");
  const terms: DiceNotationTerm[] = [];
  let diceCount = 0;
  let minimum = 0;
  let maximum = 0;
  while (remaining) {
    if (terms.length >= diceNotationLimits.maxTerms) {
      throw new RangeError(`Use at most ${diceNotationLimits.maxTerms} terms in one expression.`);
    }
    let sign: 1 | -1 = 1;
    if (remaining[0] === "+" || remaining[0] === "-") {
      sign = remaining[0] === "-" ? -1 : 1;
      remaining = remaining.slice(1).trimStart();
    } else if (terms.length > 0) {
      throw new SyntaxError("Separate dice and numbers with + or -.");
    }
    const match = /^(?:\d*\s*d\s*(?:\d+|%)|\d+)/i.exec(remaining);
    if (!match) throw new SyntaxError("Use dice and whole numbers, joined by + or -.");
    const token = match[0];
    remaining = remaining.slice(token.length).trimStart();
    let term: DiceNotationTerm;
    let low: number;
    let high: number;
    if (/d/i.test(token)) {
      const dice = parseDiceExpression(token, {
        maxDice: diceNotationLimits.maxDice,
        maxSides: diceNotationLimits.maxSides,
      });
      if (dice.sides < diceNotationLimits.minSides) {
        throw new RangeError("Dice must have between 2 and 1000 sides.");
      }
      diceCount += dice.count;
      if (diceCount > diceNotationLimits.maxDice) {
        throw new RangeError(`Roll at most ${diceNotationLimits.maxDice} dice per expression.`);
      }
      term = { kind: "dice", sign, count: dice.count, sides: dice.sides };
      low = dice.count;
      high = dice.count * dice.sides;
    } else {
      const value = Number(token);
      if (!Number.isSafeInteger(value) || value > diceNotationLimits.maxModifier) {
        throw new RangeError(`Each modifier must be at most ${diceNotationLimits.maxModifier}.`);
      }
      term = { kind: "modifier", sign, value };
      low = value;
      high = value;
    }
    terms.push(term);
    minimum += sign === 1 ? low : -high;
    maximum += sign === 1 ? high : -low;
  }
  if (diceCount === 0) throw new SyntaxError("Include at least one die, such as 1d20.");
  return {
    notation: terms
      .map(
        (term, index) =>
          `${term.sign === -1 ? "-" : index === 0 ? "" : "+"}${formatDiceTerm(term)}`,
      )
      .join(""),
    terms,
    diceCount,
    minimum,
    maximum,
  };
}

/** Validate the complete expression before consuming any randomness. */
export function rollDiceNotation(
  input: string,
  random: RandomSource = mathRandomSource,
): DiceNotationResult {
  const parsed = parseDiceNotation(input);
  const terms = parsed.terms.map((term): RolledDiceTerm => {
    const rolls =
      term.kind === "dice"
        ? Array.from({ length: term.count }, () => rollDie(term.sides, random))
        : [];
    const magnitude =
      term.kind === "modifier" ? term.value : rolls.reduce((sum, value) => sum + value, 0);
    return { ...term, rolls, subtotal: term.sign * magnitude };
  });
  return {
    notation: parsed.notation,
    terms,
    total: terms.reduce((sum, term) => sum + term.subtotal, 0),
  };
}
