import { describe, it, expect } from "vitest";
import { applyDmTool } from "@/lib/dm-tools";
import { buildDmContext } from "@/lib/dm-context";
import { emptyCharacter } from "@/lib/rules/character";
import { emptyCampaign } from "@/lib/campaign";
import { DM_SYSTEM_PROMPT } from "@/prompts/dungeon-master/system-prompt";
import { pickOpening } from "@/prompts/dungeon-master/openings";

function fixture() {
  const character = { ...emptyCharacter("hero-1"), name: "Mira", gold: 10, xp: 0 };
  character.hp = { current: 10, max: 12, temp: 0, nonlethal: 0 };
  const campaign = emptyCampaign(character.id);
  return { character, campaign };
}

describe("DM tools", () => {
  it("updates hit points, XP, gold and conditions", () => {
    const { character, campaign } = fixture();
    const res = applyDmTool(
      "updateCharacter",
      { hpDelta: -4, xpDelta: 250, goldDelta: 30, tempHp: 5, addConditions: ["shaken"] },
      character,
      campaign,
    )!;
    expect(res.character.hp.current).toBe(6);
    expect(res.character.hp.temp).toBe(5);
    expect(res.character.xp).toBe(250);
    expect(res.character.gold).toBe(40);
    expect(res.character.conditions).toContain("shaken");
    expect(res.output).toBeTruthy();

    const cleared = applyDmTool("updateCharacter", { removeConditions: ["shaken"] }, res.character, campaign)!;
    expect(cleared.character.conditions).not.toContain("shaken");

    const noop = applyDmTool("updateCharacter", {}, character, campaign)!;
    expect(noop.output).toBe("no change");
  });

  it("does not own unknown tools", () => {
    const { character, campaign } = fixture();
    expect(applyDmTool("requestRoll", {}, character, campaign)).toBeNull();
  });

  it("grants rewards and never mutates the input", () => {
    const { character, campaign } = fixture();
    const res = applyDmTool(
      "grantReward",
      { kind: "xp", detail: "Cleared the crypt", reason: "story" },
      character,
      campaign,
    );
    expect(res).not.toBeNull();
    expect(character.grants).toHaveLength(0);
  });

  it("adds and removes party members through DM tools", () => {
    const { character, campaign } = fixture();
    const added = applyDmTool(
      "upsertPartyMember",
      { name: "Bran the Guide", tier: "follower", level: 1 },
      character,
      campaign,
    );
    expect(added?.campaign.party?.length ?? 0).toBeGreaterThan(0);

    const removed = applyDmTool("removePartyMember", { name: "Bran the Guide" }, character, added!.campaign);
    expect(removed?.campaign.party?.length ?? 0).toBe(0);
  });
});

describe("DM prompts and context", () => {
  it("builds a context block from the save", () => {
    const { character, campaign } = fixture();
    const ctx = buildDmContext(character, campaign);
    expect(ctx).toContain("Mira");
    expect(ctx.length).toBeGreaterThan(50);
  });

  it("has a substantial system prompt", () => {
    expect(DM_SYSTEM_PROMPT.length).toBeGreaterThan(500);
  });

  it("picks a deterministic opening per campaign", () => {
    const { campaign } = fixture();
    const a = pickOpening(campaign as never);
    const b = pickOpening(campaign as never);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});
