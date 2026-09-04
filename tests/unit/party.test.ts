import { describe, it, expect } from "vitest";
import {
  emptyMember,
  memberFromCharacter,
  getParty,
  addMember,
  updateMember,
  removeMember,
  reorderMember,
  emptyGear,
  addGear,
  updateGear,
  removeGear,
  partySummary,
  partyContext,
  upsertMemberByName,
  removeMemberByName,
  TIERS,
  GEAR_SLOTS,
  ATTITUDES,
  ROLE_PRESETS,
} from "@/lib/party";
import { emptyCampaign } from "@/lib/campaign";
import { emptyCharacter } from "@/lib/rules/character";

describe("party roster", () => {
  it("exposes presets", () => {
    expect(TIERS).toHaveLength(3);
    expect(GEAR_SLOTS.length).toBeGreaterThan(5);
    expect(ATTITUDES).toContain("friendly");
    expect(ROLE_PRESETS).toContain("Healer");
  });

  it("builds members from scratch and from saved heroes", () => {
    const npc = emptyMember("npc", "follower");
    expect(npc.kind).toBe("npc");
    expect(npc.tier).toBe("follower");
    expect(npc.controlledBy).toBe("dm");

    const char = emptyCharacter("hero-1");
    char.name = "Mira";
    const seat = memberFromCharacter(char);
    expect(seat.name).toBe("Mira");
    expect(seat.characterId).toBe("hero-1");
    expect(seat.kind).toBe("pc");
  });

  it("adds, updates, reorders and removes members", () => {
    let campaign = emptyCampaign("hero-1");
    const a = { ...emptyMember("npc"), name: "Alda" };
    const b = { ...emptyMember("npc"), name: "Bram" };
    campaign = addMember(campaign, a);
    campaign = addMember(campaign, b);
    expect(getParty(campaign)).toHaveLength(2);

    campaign = updateMember(campaign, a.id, { hp: 12, status: "benched" });
    expect(getParty(campaign)[0]!.hp).toBe(12);

    campaign = reorderMember(campaign, b.id, -1);
    expect(getParty(campaign)[0]!.name).toBe("Bram");
    campaign = reorderMember(campaign, b.id, -1);
    expect(getParty(campaign)[0]!.name).toBe("Bram");

    campaign = removeMember(campaign, a.id);
    expect(getParty(campaign)).toHaveLength(1);
  });

  it("manages gear on a member", () => {
    let campaign = emptyCampaign("hero-1");
    const m = emptyMember("npc");
    campaign = addMember(campaign, m);
    campaign = addGear(campaign, m.id, { name: "Spear" });
    const gearId = getParty(campaign)[0]!.gear[0]!.id;
    expect(getParty(campaign)[0]!.gear).toHaveLength(1);

    campaign = updateGear(campaign, m.id, gearId, { quantity: 2, slot: "weapon" });
    expect(getParty(campaign)[0]!.gear[0]!.quantity).toBe(2);

    campaign = removeGear(campaign, m.id, gearId);
    expect(getParty(campaign)[0]!.gear).toHaveLength(0);
    expect(emptyGear().quantity).toBe(1);
  });

  it("summarises the roster and builds DM context", () => {
    let campaign = emptyCampaign("hero-1");
    campaign = addMember(campaign, { ...emptyMember("npc", "cohort"), name: "Sera", level: 5 });
    campaign = addMember(campaign, { ...emptyMember("npc", "follower"), name: "Tam", status: "gone" });
    const summary = partySummary(getParty(campaign));
    expect(summary).toBeTruthy();
    const ctx = partyContext(getParty(campaign));
    expect(ctx).toContain("Sera");
  });

  it("lets the DM add and remove members by name", () => {
    let campaign = emptyCampaign("hero-1");
    const res = upsertMemberByName(campaign, { name: "Grip the Hireling", tier: "follower", level: 2 });
    campaign = res.campaign;
    expect(getParty(campaign)).toHaveLength(1);
    expect(res.created).toBe(true);

    const again = upsertMemberByName(campaign, { name: "Grip the Hireling", hp: 9 });
    campaign = again.campaign;
    expect(getParty(campaign)).toHaveLength(1);
    expect(getParty(campaign)[0]!.hp).toBe(9);

    campaign = removeMemberByName(campaign, "Grip the Hireling");
    expect(getParty(campaign)).toHaveLength(0);
    expect(getParty(removeMemberByName(campaign, "nobody"))).toHaveLength(0);
  });
});
