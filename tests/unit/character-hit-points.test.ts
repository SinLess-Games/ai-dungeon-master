import { describe, expect, it } from "vitest";
import { maximumHitPointsFromClassTracks } from "@/modules/characters/domain/hitPoints";

describe("character hit point calculation", () => {
  it("uses the better gestalt hit point result once per character level", () => {
    expect(
      maximumHitPointsFromClassTracks(
        [
          { characterLevel: 1, hitPointsGained: 6 },
          { characterLevel: 1, hitPointsGained: 10 },
          { characterLevel: 2, hitPointsGained: 4 },
          { characterLevel: 2, hitPointsGained: 8 },
        ],
        2,
      ),
    ).toBe(22);
  });

  it("enforces the D&D 3.5 minimum of one HP per class Hit Die after Constitution", () => {
    expect(
      maximumHitPointsFromClassTracks(
        [
          { characterLevel: 1, hitPointsGained: 4 },
          { characterLevel: 2, hitPointsGained: 2 },
        ],
        -5,
      ),
    ).toBe(2);
  });

  it("rejects invalid persisted HP rows instead of silently corrupting runtime health", () => {
    expect(() =>
      maximumHitPointsFromClassTracks([{ characterLevel: 1, hitPointsGained: 0 }], 0),
    ).toThrow(/Hit points gained/);
  });
});
