import { describe, expect, it } from "vitest";
import {
  matchInlineSkill,
  parseDiceExpression,
} from "@/modules/campaigns/server/chatRolls";
import type { DmPlannerSkillOption } from "@/modules/campaigns/server/dmToolPlanner";

const skills: DmPlannerSkillOption[] = [
  {
    id: "spot",
    name: "Spot",
    ability: "wis",
    specialization: "",
    ranks: 5,
    trainedOnly: false,
  },
  {
    id: "knowledge",
    name: "Knowledge",
    ability: "int",
    specialization: "arcana",
    ranks: 8,
    trainedOnly: true,
  },
  {
    id: "knowledge",
    name: "Knowledge",
    ability: "int",
    specialization: "religion",
    ranks: 6,
    trainedOnly: true,
  },
];

describe("campaign inline chat rolls", () => {
  it("parses signed dice expressions with optional whitespace", () => {
    expect(parseDiceExpression("1d20+8")).toEqual({
      count: 1,
      sides: 20,
      modifier: 8,
      canonical: "1d20+8",
    });
    expect(parseDiceExpression("1d20 - 8")).toEqual({
      count: 1,
      sides: 20,
      modifier: -8,
      canonical: "1d20-8",
    });
    expect(parseDiceExpression("2d6")).toEqual({
      count: 2,
      sides: 6,
      modifier: 0,
      canonical: "2d6",
    });
  });

  it("rejects unsafe or nonsensical dice sizes", () => {
    expect(() => parseDiceExpression("0d20")).toThrow(/between 1 and 100 dice/i);
    expect(() => parseDiceExpression("101d20")).toThrow(/between 1 and 100 dice/i);
    expect(() => parseDiceExpression("1d1")).toThrow(/2 to 10,000 sides/i);
    expect(() => parseDiceExpression("1d10001")).toThrow(/2 to 10,000 sides/i);
  });

  it("matches character skills using names, underscores, and specializations", () => {
    expect(matchInlineSkill(skills, "Spot")?.id).toBe("spot");
    expect(matchInlineSkill(skills, "spot")?.id).toBe("spot");
    expect(matchInlineSkill(skills, "Knowledge (arcana)")?.specialization).toBe("arcana");
    expect(matchInlineSkill(skills, "knowledge_arcana")?.specialization).toBe("arcana");
    expect(matchInlineSkill(skills, "Knowledge religion")?.specialization).toBe("religion");
  });

  it("requires a specialization when a bare skill name is ambiguous", () => {
    expect(() => matchInlineSkill(skills, "Knowledge")).toThrow(/ambiguous/i);
    expect(matchInlineSkill(skills, "Tumble")).toBeNull();
  });
});
