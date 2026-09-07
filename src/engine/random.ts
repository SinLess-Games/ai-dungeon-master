export interface RandomSource {
  /** Return a floating-point value in the half-open interval [0, 1). */
  next(): number;
}

export const mathRandomSource: RandomSource = {
  next: () => Math.random(),
};

function assertFiniteInteger(value: number, name: string): void {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new RangeError(`${name} must be a finite integer.`);
  }
}

function assertUnitInterval(value: number): void {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("RandomSource.next() must return a value in [0, 1). ");
  }
}

function hashStringSeed(seed: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function normalizeSeed(seed: number | string): number {
  if (typeof seed === "string") {
    return hashStringSeed(seed) || 0x6d2b79f5;
  }

  assertFiniteInteger(seed, "seed");
  return (seed >>> 0) || 0x6d2b79f5;
}

/**
 * Small deterministic PRNG for replays, tests, seeded generation, and simulations.
 *
 * This is not intended for cryptographic use. The same seed always produces the
 * same sequence across supported JavaScript runtimes.
 */
export function createSeededRandom(seed: number | string): RandomSource {
  let state = normalizeSeed(seed);

  return {
    next(): number {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function randomIntInclusive(
  minimum: number,
  maximum: number,
  random: RandomSource = mathRandomSource,
): number {
  assertFiniteInteger(minimum, "minimum");
  assertFiniteInteger(maximum, "maximum");

  if (maximum < minimum) {
    throw new RangeError("maximum must be greater than or equal to minimum.");
  }

  const value = random.next();
  assertUnitInterval(value);

  return minimum + Math.floor(value * (maximum - minimum + 1));
}
