import { describe, expect, it } from "vitest";
import {
  createRoundConditionAnchor,
  roundConditionTransition,
} from "@/modules/game/domain/conditionTiming";

describe("encounter condition timing", () => {
  it("anchors a one-round condition to the same initiative slot next round", () => {
    expect(
      createRoundConditionAnchor({
        currentRound: 3,
        currentTurnOrder: 2,
        durationRounds: 1,
      }),
    ).toEqual({
      expiresEncounterRound: 4,
      expiresTurnOrder: 2,
    });
  });

  it("does not expire an effect merely because the global round boundary passed", () => {
    const anchor = createRoundConditionAnchor({
      currentRound: 1,
      currentTurnOrder: 2,
      durationRounds: 1,
    });

    expect(
      roundConditionTransition({
        anchor,
        destination: { roundNumber: 2, turnOrder: 0 },
        remainingRounds: 1,
      }),
    ).toBe("unchanged");
    expect(
      roundConditionTransition({
        anchor,
        destination: { roundNumber: 2, turnOrder: 1 },
        remainingRounds: 1,
      }),
    ).toBe("unchanged");
    expect(
      roundConditionTransition({
        anchor,
        destination: { roundNumber: 2, turnOrder: 2 },
        remainingRounds: 1,
      }),
    ).toBe("expire");
  });

  it("decrements a multi-round condition only when its initiative slot is reached", () => {
    const anchor = createRoundConditionAnchor({
      currentRound: 1,
      currentTurnOrder: 1,
      durationRounds: 2,
    });

    expect(
      roundConditionTransition({
        anchor,
        destination: { roundNumber: 2, turnOrder: 0 },
        remainingRounds: 2,
      }),
    ).toBe("unchanged");
    expect(
      roundConditionTransition({
        anchor,
        destination: { roundNumber: 2, turnOrder: 1 },
        remainingRounds: 2,
      }),
    ).toBe("decrement");
    expect(
      roundConditionTransition({
        anchor,
        destination: { roundNumber: 3, turnOrder: 1 },
        remainingRounds: 1,
      }),
    ).toBe("expire");
  });

  it("rejects zero-length round durations", () => {
    expect(() =>
      createRoundConditionAnchor({
        currentRound: 1,
        currentTurnOrder: 0,
        durationRounds: 0,
      }),
    ).toThrow(/positive safe integer/i);
  });
});
