import { describe, expect, it } from "vitest";
import { parseDmTurnDecision } from "@/modules/campaigns/server/dmToolPlanner";

describe("AI DM turn planner", () => {
  it("parses a narration decision", () => {
    expect(
      parseDmTurnDecision('{"kind":"narration","text":"The corridor remains quiet."}'),
    ).toEqual({
      kind: "narration",
      text: "The corridor remains quiet.",
    });
  });

  it("accepts fenced JSON returned by a compatible model", () => {
    expect(
      parseDmTurnDecision(
        '```json\n{"kind":"narration","text":"A cold draft curls beneath the door."}\n```',
      ),
    ).toEqual({
      kind: "narration",
      text: "A cold draft curls beneath the door.",
    });
  });

  it("parses a structured skill check request", () => {
    expect(
      parseDmTurnDecision(
        JSON.stringify({
          kind: "check",
          preface: "The seam is almost invisible. Give me a Search check.",
          check: {
            type: "check.skill",
            skillId: "phb-skill-search",
            dc: 18,
            reason: "Notice the concealed pressure plate before crossing the threshold.",
          },
        }),
      ),
    ).toMatchObject({
      kind: "check",
      check: {
        type: "check.skill",
        skillId: "phb-skill-search",
        dc: 18,
      },
    });
  });

  it("parses a structured saving throw request", () => {
    expect(
      parseDmTurnDecision(
        JSON.stringify({
          kind: "check",
          preface: "The rune erupts in violet light. Make a Will save.",
          check: {
            type: "check.save",
            save: "will",
            dc: 17,
            reason: "Resist the rune's compulsion.",
          },
        }),
      ),
    ).toMatchObject({
      kind: "check",
      check: { type: "check.save", save: "will", dc: 17 },
    });
  });

  it("rejects malformed or unsafe planner output", () => {
    expect(() =>
      parseDmTurnDecision(
        JSON.stringify({
          kind: "check",
          preface: "Roll.",
          check: {
            type: "check.skill",
            skillId: "search",
            dc: -1,
            reason: "Invalid negative DC.",
          },
        }),
      ),
    ).toThrow();

    expect(() =>
      parseDmTurnDecision('{"kind":"mutate_hp","amount":999}'),
    ).toThrow();
  });
});
