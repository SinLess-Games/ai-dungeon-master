import {
  mathRandomSource,
  randomIntInclusive,
  type RandomSource,
} from "@/engine/random";

export interface DiceLimits {
  maxDice: number;
  maxSides: number;
  maxAbsoluteModifier: number;
}

export const defaultDiceLimits: DiceLimits = {
  maxDice: 10_000,
  maxSides: 1_000_000,
  maxAbsoluteModifier: 1_000_000_000,
};

export interface DiceExpression {
  count: number;
  sides: number;
  modifier: number;
  notation: string;
}

export interface DiceRollResult {
  expression: DiceExpression;
  rolls: readonly number[];
  subtotal: number;
  modifier: number;
  total: number;
}

export interface RollDiceOptions {
  random?: RandomSource;
  limits?: Partial<DiceLimits>;
}

function resolveLimits(overrides?: Partial<DiceLimits>): DiceLimits {
  return {
    maxDice: overrides?.maxDice ?? defaultDiceLimits.maxDice,
    maxSides: overrides?.maxSides ?? defaultDiceLimits.maxSides,
    maxAbsoluteModifier:
      overrides?.maxAbsoluteModifier ?? defaultDiceLimits.maxAbsoluteModifier,
  };
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
}

function normalizeNotation(count: number, sides: number, modifier: number): string {
  const suffix = modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`;
  return `${count}d${sides}${suffix}`;
}

function validateExpression(expression: DiceExpression, limits: DiceLimits): void {
  assertPositiveInteger(expression.count, "Dice count");
  assertPositiveInteger(expression.sides, "Dice sides");

  if (!Number.isSafeInteger(expression.modifier)) {
    throw new RangeError("Dice modifier must be a safe integer.");
  }

  if (expression.count > limits.maxDice) {
    throw new RangeError(`Dice count cannot exceed ${limits.maxDice}.`);
  }

  if (expression.sides > limits.maxSides) {
    throw new RangeError(`Dice sides cannot exceed ${limits.maxSides}.`);
  }

  if (Math.abs(expression.modifier) > limits.maxAbsoluteModifier) {
    throw new RangeError(
      `Absolute dice modifier cannot exceed ${limits.maxAbsoluteModifier}.`,
    );
  }
}

/**
 * Parse standard tabletop notation such as d20, 2d6+3, 4d8 - 2, or d%.
 *
 * This deliberately supports one dice group plus one flat modifier. More
 * complicated expression trees can be layered on top without changing the
 * primitive roll contract.
 */
export function parseDiceExpression(
  notation: string,
  limitsOverride?: Partial<DiceLimits>,
): DiceExpression {
  const compact = notation.replace(/\s+/g, "");
  const match = /^(\d*)d(\d+|%)(?:([+-])(\d+))?$/i.exec(compact);

  if (!match) {
    throw new SyntaxError(`Invalid dice notation: ${notation}`);
  }

  const countText = match[1];
  const sidesText = match[2];
  const sign = match[3];
  const modifierText = match[4];

  const count = countText ? Number(countText) : 1;
  const sides = sidesText === "%" ? 100 : Number(sidesText);
  const unsignedModifier = modifierText ? Number(modifierText) : 0;
  const modifier = sign === "-" ? -unsignedModifier : unsignedModifier;

  const expression: DiceExpression = {
    count,
    sides,
    modifier,
    notation: normalizeNotation(count, sides, modifier),
  };

  validateExpression(expression, resolveLimits(limitsOverride));
  return expression;
}

export function rollDie(
  sides: number,
  random: RandomSource = mathRandomSource,
): number {
  assertPositiveInteger(sides, "Dice sides");
  return randomIntInclusive(1, sides, random);
}

export function rollDice(
  input: string | DiceExpression,
  options: RollDiceOptions = {},
): DiceRollResult {
  const limits = resolveLimits(options.limits);
  const expression =
    typeof input === "string" ? parseDiceExpression(input, limits) : input;

  validateExpression(expression, limits);

  const random = options.random ?? mathRandomSource;
  const rolls: number[] = [];
  let subtotal = 0;

  for (let index = 0; index < expression.count; index += 1) {
    const result = rollDie(expression.sides, random);
    rolls.push(result);
    subtotal += result;
  }

  return {
    expression: {
      ...expression,
      notation: normalizeNotation(
        expression.count,
        expression.sides,
        expression.modifier,
      ),
    },
    rolls,
    subtotal,
    modifier: expression.modifier,
    total: subtotal + expression.modifier,
  };
}
