import { describe, it, expect, beforeEach } from "vitest";
import { applyDmTool } from "@/lib/dm-tools";
import { emptyCharacter } from "@/lib/rules/character";
import { emptyCampaign } from "@/lib/campaign";
import { getParty } from "@/lib/party";

function fixture() {
  const character = emptyCharacter("hero");
  character.name = "Mira";
  const campaign = emptyCampaign(character.id);
  return { character, campaign };
}

beforeEach(() => localStorage.clear());

describe("DM tools", () => {
  it("ignores unknown tools", () => {
    const { character, campaign } = fixture();
    expect(applyDmTool("requestRoll", {}, character, campaign)).toBeNull();
  });

  it("updates hit points, temp hp, nonlethal, xp, gold and conditions", () => {
    const { character, campaign } = fixture();
    const res = applyDmTool(
      "updateCharacter",
      {
        hpDelta: -4,
        tempHp: 5,
        nonlethalDelta: 3,
        xpDelta: 250,
        goldDelta: 30,
        addConditions: ["shaken"],
        removeConditions: [],
      },
      character,
      campaign,
    )!;
    expect(res.character.hp.current).toBe(character.hp.current - 4);
    expect(res.character.hp.temp).toBe(5);
    expect(res.character.hp.nonlethal).toBe(3);
    expect(res.character.xp).toBe(250);
    expect(res.character.gold).toBe(character.gold + 30);
    expect(res.character.conditions).toContain("shaken");
    expect(res.output).toContain("HP");

    const cleared = applyDmTool("updateCharacter", { removeConditions: ["shaken"] }, res.character, res.campaign)!;
    expect(cleared.character.conditions).not.toContain("shaken");

    const noop = applyDmTool("updateCharacter", {}, character, campaign)!;
    expect(noop.output).toBe("no change");
  });

  it("grants rewards and awards xp from an xp grant", () => {
    const { character, campaign } = fixture();
    const res = applyDmTool("grantReward", { kind: "xp", detail: "900", reason: "beat the ogre" }, character, campaign)!;
    expect(res.character.xp).toBe(900);
    expect(res.character.grants).toHaveLength(1);

    const item = applyDmTool("grantReward", { kind: "item", detail: "Cloak" }, res.character, res.campaign)!;
    expect(item.character.grants).toHaveLength(2);
    expect(item.character.xp).toBe(900);
  });

  it("changes alignment with a logged reason", () => {
    const { character, campaign } = fixture();
    const res = applyDmTool("setAlignment", { alignment: "CE", reason: "betrayal" }, character, campaign)!;
    expect(res.character.alignment).toBe("CE");
    expect(res.character.grants[0]!.kind).toBe("alignment");
  });

  it("adds loot with sane defaults", () => {
    const { character, campaign } = fixture();
    const res = applyDmTool("addLoot", { name: "Rope", quantity: 2, weight: 10, cost: 1, note: "hemp" }, character, campaign)!;
    expect(res.character.inventory[0]).toMatchObject({ name: "Rope", quantity: 2, location: "person" });

    const bare = applyDmTool("addLoot", {}, character, campaign)!;
    expect(bare.character.inventory[0]!.quantity).toBe(1);
    expect(bare.character.inventory[0]!.name).toBe("Item");
  });

  it("updates the scene", () => {
    const { character, campaign } = fixture();
    const res = applyDmTool(
      "updateScene",
      { location: "Crypt", region: "Moors", timeOfDay: "night", weather: "rain", inCombat: true, round: 2, summary: "ambush" },
      character,
      campaign,
    )!;
    expect(res.campaign.scene.location).toBe("Crypt");
    expect(res.campaign.scene.inCombat).toBe(true);
    expect(res.campaign.scene.round).toBe(2);
    expect(res.output).toContain("Crypt");
  });

  it("creates and updates NPCs and quests", () => {
    const { character, campaign } = fixture();
    let state = applyDmTool("upsertNpc", { name: "Old Bram", role: "innkeeper", notes: "knows the road" }, character, campaign)!;
    expect(state.campaign.npcs).toHaveLength(1);
    state = applyDmTool("upsertNpc", { name: "old bram", attitude: "friendly" }, state.character, state.campaign)!;
    expect(state.campaign.npcs).toHaveLength(1);
    expect(state.campaign.npcs[0]!.attitude).toBe("friendly");

    state = applyDmTool("upsertQuest", { title: "Find the bell", detail: "stolen" }, state.character, state.campaign)!;
    expect(state.campaign.quests[0]!.status).toBe("active");
    state = applyDmTool("upsertQuest", { title: "find the bell", status: "complete" }, state.character, state.campaign)!;
    expect(state.campaign.quests).toHaveLength(1);
    expect(state.campaign.quests[0]!.status).toBe("complete");
  });

  it("adds and removes party members", () => {
    const { character, campaign } = fixture();
    let state = applyDmTool(
      "upsertPartyMember",
      { name: "Kest", tier: "cohort", level: 4, hp: 22, gear: [{ name: "Spear" }] },
      character,
      campaign,
    )!;
    expect(getParty(state.campaign)).toHaveLength(1);
    expect(state.output).toContain("joined the party");

    state = applyDmTool("upsertPartyMember", { name: "Kest", hp: 10 }, state.character, state.campaign)!;
    expect(state.output).toContain("roster updated");

    state = applyDmTool("removePartyMember", { name: "Kest" }, state.character, state.campaign)!;
    expect(getParty(state.campaign)).toHaveLength(0);
  });

  it("shapes the world, moves the party and discovers sites", () => {
    const { character, campaign } = fixture();
    let state = applyDmTool(
      "shapeWorld",
      {
        worldName: "Ashfen",
        tagline: "a drowned realm",
        premise: "the sea took the kingdom",
        regions: [{ name: "The Sunken Vale", terrain: "swamp", description: "wet" }],
        sites: [{ name: "Gullhaven", kind: "town", regionName: "The Sunken Vale", x: 20, y: 20 }],
      },
      character,
      campaign,
    )!;
    expect(state.campaign.worldName).toBe("Ashfen");
    expect(state.output).toContain("Ashfen");

    state = applyDmTool("moveParty", { siteName: "Gullhaven" }, state.character, state.campaign)!;
    expect(state.output).toContain("Gullhaven");

    state = applyDmTool("moveParty", { x: 40, y: 30 }, state.character, state.campaign)!;
    expect(state.output).toContain("party now at");

    state = applyDmTool("moveParty", { siteName: "Nowhere at all" }, state.character, state.campaign)!;
    expect(state.output).toContain("no such place");

    state = applyDmTool("discoverSite", { name: "Gullhaven" }, state.character, state.campaign)!;
    expect(state.output).toContain("Gullhaven");

    state = applyDmTool("discoverSite", { name: "Nowhere at all" }, state.character, state.campaign)!;
    expect(state.output).toContain("no such place");
  });

  it("keeps a capped journal", () => {
    const { character, campaign } = fixture();
    let state = { character, campaign };
    for (let i = 0; i < 205; i++) {
      state = applyDmTool("addJournal", { text: `entry ${i}` }, state.character, state.campaign)!;
    }
    expect(state.campaign.journal).toHaveLength(200);
    expect(state.campaign.journal[0]!.text).toBe("entry 204");
  });
});
