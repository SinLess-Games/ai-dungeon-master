export type Dnd35Alignment = "LG" | "NG" | "CG" | "LN" | "N" | "CN" | "LE" | "NE" | "CE";

export interface AlignmentAxisScores {
  /** Positive values are lawful; negative values are chaotic. */
  lawChaos: number;
  /** Positive values are good; negative values are evil. */
  goodEvil: number;
}

export interface AlignmentDrift {
  lawChaosDelta: number;
  goodEvilDelta: number;
}

export const alignmentScoreLimits = {
  minimum: -100,
  maximum: 100,
  /** A score must leave the neutral band before the public alignment changes. */
  nonNeutralThreshold: 25,
  /** Existing non-neutral alignments begin with room for ordinary drift. */
  initialNonNeutralScore: 50,
  /** One recorded act cannot move either axis by more than this amount. */
  maxSingleActionDelta: 20,
} as const;

function clampScore(value: number): number {
  if (!Number.isSafeInteger(value)) throw new RangeError("Alignment scores must be safe integers.");
  return Math.max(alignmentScoreLimits.minimum, Math.min(alignmentScoreLimits.maximum, value));
}

function axisValue(code: "L" | "N" | "C" | "G" | "E"): number {
  if (code === "L" || code === "G") return alignmentScoreLimits.initialNonNeutralScore;
  if (code === "C" || code === "E") return -alignmentScoreLimits.initialNonNeutralScore;
  return 0;
}

export function alignmentToScores(alignment: Dnd35Alignment): AlignmentAxisScores {
  if (alignment === "N") return { lawChaos: 0, goodEvil: 0 };
  const lawChaos = alignment[0] as "L" | "N" | "C";
  const goodEvil = alignment[1] as "G" | "N" | "E";
  return {
    lawChaos: axisValue(lawChaos),
    goodEvil: axisValue(goodEvil),
  };
}

function lawChaosCode(score: number): "L" | "N" | "C" {
  if (score > alignmentScoreLimits.nonNeutralThreshold) return "L";
  if (score < -alignmentScoreLimits.nonNeutralThreshold) return "C";
  return "N";
}

function goodEvilCode(score: number): "G" | "N" | "E" {
  if (score > alignmentScoreLimits.nonNeutralThreshold) return "G";
  if (score < -alignmentScoreLimits.nonNeutralThreshold) return "E";
  return "N";
}

export function alignmentFromScores(scores: AlignmentAxisScores): Dnd35Alignment {
  const lawChaos = lawChaosCode(clampScore(scores.lawChaos));
  const goodEvil = goodEvilCode(clampScore(scores.goodEvil));
  if (lawChaos === "N" && goodEvil === "N") return "N";
  return `${lawChaos}${goodEvil}` as Dnd35Alignment;
}

function validateDelta(value: number, name: string): number {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name} must be a safe integer.`);
  if (Math.abs(value) > alignmentScoreLimits.maxSingleActionDelta) {
    throw new RangeError(
      `${name} must be between -${alignmentScoreLimits.maxSingleActionDelta} and ${alignmentScoreLimits.maxSingleActionDelta}.`,
    );
  }
  return value;
}

export function applyAlignmentDrift(
  current: AlignmentAxisScores,
  drift: AlignmentDrift,
): { scores: AlignmentAxisScores; alignment: Dnd35Alignment } {
  const lawChaosDelta = validateDelta(drift.lawChaosDelta, "Law/chaos alignment delta");
  const goodEvilDelta = validateDelta(drift.goodEvilDelta, "Good/evil alignment delta");
  const scores = {
    lawChaos: clampScore(current.lawChaos + lawChaosDelta),
    goodEvil: clampScore(current.goodEvil + goodEvilDelta),
  };
  return { scores, alignment: alignmentFromScores(scores) };
}
