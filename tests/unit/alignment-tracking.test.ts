import { describe, expect, it } from "vitest";
import {
  alignmentFromScores,
  alignmentScoreLimits,
  alignmentToScores,
  applyAlignmentDrift,
} from "@/rulesets/dnd35/alignmentTracking";

describe("D&D 3.5 alignment tracking", () => {
  it("seeds the two axes from the public alignment", () => {
    expect(alignmentToScores("LG")).toEqual({ lawChaos: 50, goodEvil: 50 });
    expect(alignmentToScores("CN")).toEqual({ lawChaos: -50, goodEvil: 0 });
    expect(alignmentToScores("NE")).toEqual({ lawChaos: 0, goodEvil: -50 });
    expect(alignmentToScores("N")).toEqual({ lawChaos: 0, goodEvil: 0 });
  });

  it("keeps small drift inside the neutral band from changing public alignment", () => {
    const result = applyAlignmentDrift(
      { lawChaos: 0, goodEvil: 0 },
      { lawChaosDelta: 5, goodEvilDelta: 10 },
    );
    expect(result.scores).toEqual({ lawChaos: 5, goodEvil: 10 });
    expect(result.alignment).toBe("N");
  });

  it("changes public alignment only after a threshold is crossed", () => {
    expect(
      alignmentFromScores({
        lawChaos: alignmentScoreLimits.nonNeutralThreshold,
        goodEvil: 0,
      }),
    ).toBe("N");
    expect(
      alignmentFromScores({
        lawChaos: alignmentScoreLimits.nonNeutralThreshold + 1,
        goodEvil: 0,
      }),
    ).toBe("LN");
    expect(alignmentFromScores({ lawChaos: -40, goodEvil: 35 })).toBe("CG");
  });

  it("accumulates drift gradually and clamps both axes", () => {
    let state = { lawChaos: 95, goodEvil: -95 };
    const result = applyAlignmentDrift(state, { lawChaosDelta: 20, goodEvilDelta: -20 });
    state = result.scores;
    expect(state).toEqual({ lawChaos: 100, goodEvil: -100 });
    expect(result.alignment).toBe("LE");
  });

  it("rejects one-shot alignment deltas outside the bounded range", () => {
    expect(() =>
      applyAlignmentDrift(
        { lawChaos: 0, goodEvil: 0 },
        { lawChaosDelta: 21, goodEvilDelta: 0 },
      ),
    ).toThrow(RangeError);
    expect(() =>
      applyAlignmentDrift(
        { lawChaos: 0, goodEvil: 0 },
        { lawChaosDelta: 0, goodEvilDelta: -21 },
      ),
    ).toThrow(RangeError);
  });
});
