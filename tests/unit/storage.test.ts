import { describe, it, expect, beforeEach } from "vitest";
import {
  newId,
  listCharacters,
  getCharacter,
  saveCharacter,
  deleteCharacter,
  duplicateCharacter,
  listRolls,
  pushRoll,
  clearRolls,
  listCampaigns,
  getCampaign,
  saveCampaign,
  deleteCampaign,
  listWorlds,
  getWorld,
  saveWorld,
  deleteWorld,
  listMaps,
  getMap,
  saveMap,
  deleteMap,
  listDeletions,
  isDeleted,
  clearDeletions,
  recordDeletion,
} from "@/lib/storage";
import { emptyCharacter } from "@/lib/rules/character";
import { emptyCampaign } from "@/lib/campaign";
import { emptyWorld } from "@/lib/world";
import { emptyMap } from "@/lib/tacticalmap";

beforeEach(() => localStorage.clear());

describe("local storage layer", () => {
  it("mints unique ids", () => {
    expect(newId()).not.toBe(newId());
  });

  it("saves, reads, duplicates and deletes characters", () => {
    const c = { ...emptyCharacter(newId()), name: "Mira" };
    saveCharacter(c);
    expect(listCharacters()).toHaveLength(1);
    expect(getCharacter(c.id)?.name).toBe("Mira");

    const copy = duplicateCharacter(c.id);
    expect(listCharacters()).toHaveLength(2);
    expect(copy?.id).not.toBe(c.id);

    deleteCharacter(c.id);
    expect(getCharacter(c.id)).toBeUndefined();
    expect(isDeleted("characters", c.id)).toBe(true);
  });

  it("keeps a roll history", () => {
    pushRoll({ id: newId(), notation: "1d20", total: 17, at: new Date().toISOString() } as never);
    expect(listRolls()).toHaveLength(1);
    clearRolls();
    expect(listRolls()).toHaveLength(0);
  });

  it("saves campaigns, worlds and maps", () => {
    const campaign = emptyCampaign("hero-1");
    saveCampaign(campaign as never);
    expect(listCampaigns()).toHaveLength(1);
    expect(getCampaign(campaign.id)).toBeTruthy();

    const world = emptyWorld(newId(), "Aeloria");
    saveWorld(world);
    expect(listWorlds()).toHaveLength(1);
    expect(getWorld(world.id)?.name).toBe("Aeloria");

    const map = emptyMap(newId(), "Crypt", newId());
    saveMap({ ...map, worldId: world.id } as never);
    expect(listMaps()).toHaveLength(1);
    expect(listMaps(world.id)).toHaveLength(1);
    expect(listMaps("other")).toHaveLength(0);
    expect(getMap(map.id)).toBeTruthy();

    deleteCampaign(campaign.id);
    deleteWorld(world.id);
    deleteMap(map.id);
    expect(listCampaigns()).toHaveLength(0);
    expect(listWorlds()).toHaveLength(0);
    expect(listMaps()).toHaveLength(0);
  });

  it("keeps tombstones so deletes stay deleted", () => {
    recordDeletion("worlds", "w-9");
    expect(isDeleted("worlds", "w-9")).toBe(true);
    const done = listDeletions();
    expect(done.length).toBeGreaterThan(0);
    clearDeletions(done);
    expect(isDeleted("worlds", "w-9")).toBe(false);
  });
});
