import { describe, expect, it } from "vitest";
import { parseAlignmentEvaluation } from "@/modules/campaigns/server/alignmentEvaluator";

describe("AI alignment evaluator parser", () => {
  it("accepts an explicit no-op decision", () => {
    expect(parseAlignmentEvaluation('{"record":false}')).toEqual({ record: false });
  });

  it("accepts a bounded, auditable alignment event", () => {
    expect(
      parseAlignmentEvaluation(
        JSON.stringify({
          record: true,
          lawChaosDelta: -3,
          goodEvilDelta: 7,
          reason: "The character defied an unlawful order to protect captives.",
        }),
      ),
    ).toEqual({
      record: true,
      lawChaosDelta: -3,
      goodEvilDelta: 7,
      reason: "The character defied an unlawful order to protect captives.",
    });
  });

  it("accepts fenced JSON from a compatible model", () => {
    expect(
      parseAlignmentEvaluation(
        '```json\n{"record":true,"lawChaosDelta":2,"goodEvilDelta":0,"reason":"Kept a sworn obligation at personal cost."}\n```',
      ),
    ).toMatchObject({ record: true, lawChaosDelta: 2, goodEvilDelta: 0 });
  });

  it("rejects deltas outside the deterministic service limit", () => {
    expect(() =>
      parseAlignmentEvaluation(
        JSON.stringify({
          record: true,
          lawChaosDelta: 0,
          goodEvilDelta: 50,
          reason: "Unsafe one-shot shift.",
        }),
      ),
    ).toThrow();
  });

  it("rejects missing reasons and invented alignment labels", () => {
    expect(() =>
      parseAlignmentEvaluation(
        JSON.stringify({ record: true, lawChaosDelta: 1, goodEvilDelta: 1 }),
      ),
    ).toThrow();
    expect(() => parseAlignmentEvaluation('{"record":true,"alignment":"CE"}')).toThrow();
  });
});
