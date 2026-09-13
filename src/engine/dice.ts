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

export interface DiceFormulaTerm {
  sign: 1 | -1;
  expression: DiceExpression;
}

export interface DiceFormula {
  terms: readonly DiceFormulaTerm[];
  modifier: number;
  notation: string;
}

export interface DiceFormulaTermResult {
  sign: 1 | -1;
  expression: DiceExpression;
  rolls: readonly number[];
  subtotal: number;
  signedSubtotal: number;
}

export interface DiceFormulaRollResult {
  formula: DiceFormula;
  terms: readonly DiceFormulaTermResult[];
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
 * Parse one standard tabletop dice group such as d20, 2d6+3, 4d8 - 2, or d%.
 *
 * Use parseDiceFormula when an expression contains multiple dice groups.
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

function normalizeFormula(terms: readonly DiceFormulaTerm[], modifier: number): string {
  const dice = terms
    .map((term, index) => {
      const notation = normalizeNotation(term.expression.count, term.expression.sides, 0);
      if (index === 0) return term.sign < 0 ? `-${notation}` : notation;
      return `${term.sign < 0 ? "-" : "+"}${notation}`;
    })
    .join("");
  const flat = modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`;
  return `${dice}${flat}`;
}

/**
 * Parse tabletop arithmetic with multiple dice groups and a flat modifier.
 *
 * Examples: 2d6 + 1d4 + 3, d20 + d6 - 2, 4d8 - 1d8, d%.
 * The total number of dice across all groups is constrained by maxDice.
 */
export function parseDiceFormula(
  notation: string,
  limitsOverride?: Partial<DiceLimits>,
): DiceFormula {
  const compact = notation.replace(/\s+/g, "");
  const limits = resolveLimits(limitsOverride);

  if (!compact) throw new SyntaxError("Dice notation cannot be empty.");

  const pieces = compact.match(/[+-]?[^+-]+/g);
  if (!pieces || pieces.join("") !== compact) {
    throw new SyntaxError(`Invalid dice notation: ${notation}`);
  }

  const terms: DiceFormulaTerm[] = [];
  let modifier = 0;
  let totalDice = 0;

  for (const piece of pieces) {
    const sign: 1 | -1 = piece.startsWith("-") ? -1 : 1;
    const body = piece.startsWith("+") || piece.startsWith("-") ? piece.slice(1) : piece;

    if (!body) throw new SyntaxError(`Invalid dice notation: ${notation}`);

    if (/^\d*d(?:\d+|%)$/i.test(body)) {
      const expression = parseDiceExpression(body, limits);
      totalDice += expression.count;
      if (totalDice > limits.maxDice) {
        throw new RangeError(`Total dice count cannot exceed ${limits.maxDice}.`);
      }
      terms.push({
        sign,
        expression: {
          ...expression,
          modifier: 0,
          notation: normalizeNotation(expression.count, expression.sides, 0),
        },
      });
      continue;
    }

    if (/^\d+$/.test(body)) {
      const value = Number(body);
      if (!Number.isSafeInteger(value)) {
        throw new RangeError("Dice modifier must be a safe integer.");
      }
      modifier += sign * value;
      if (!Number.isSafeInteger(modifier)) {
        throw new RangeError("Dice modifier must be a safe integer.");
      }
      continue;
    }

    throw new SyntaxError(`Invalid dice notation: ${notation}`);
  }

  if (terms.length === 0) {
    throw new SyntaxError("A dice formula must include at least one dice term.");
  }

  if (Math.abs(modifier) > limits.maxAbsoluteModifier) {
    throw new RangeError(
      `Absolute dice modifier cannot exceed ${limits.maxAbsoluteModifier}.`,
    );
  }

  return {
    terms,
    modifier,
    notation: normalizeFormula(terms, modifier),
  };
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

export function rollDiceFormula(
  input: string | DiceFormula,
  options: RollDiceOptions = {},
): DiceFormulaRollResult {
  const limits = resolveLimits(options.limits);
  const formula = typeof input === "string" ? parseDiceFormula(input, limits) : input;
  const random = options.random ?? mathRandomSource;

  let totalDice = 0;
  for (const term of formula.terms) {
    validateExpression(term.expression, limits);
    totalDice += term.expression.count;
  }
  if (totalDice > limits.maxDice) {
    throw new RangeError(`Total dice count cannot exceed ${limits.maxDice}.`);
  }
  if (!Number.isSafeInteger(formula.modifier)) {
    throw new RangeError("Dice modifier must be a safe integer.");
  }
  if (Math.abs(formula.modifier) > limits.maxAbsoluteModifier) {
    throw new RangeError(
      `Absolute dice modifier cannot exceed ${limits.maxAbsoluteModifier}.`,
    );
  }

  const terms = formula.terms.map((term): DiceFormulaTermResult => {
    const result = rollDice(term.expression, { random, limits });
    return {
      sign: term.sign,
      expression: result.expression,
      rolls: result.rolls,
      subtotal: result.subtotal,
      signedSubtotal: result.subtotal * term.sign,
    };
  });
  const subtotal = terms.reduce((sum, term) => sum + term.signedSubtotal, 0);

  return {
    formula: {
      terms: formula.terms,
      modifier: formula.modifier,
      notation: normalizeFormula(formula.terms, formula.modifier),
    },
    terms,
    subtotal,
    modifier: formula.modifier,
    total: subtotal + formula.modifier,
  };
}
