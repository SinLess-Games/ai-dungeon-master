import { afterEach, describe, expect, it } from "vitest";
import {
  cacheJsonResponse,
  listOfflineMutations,
  offlineRequestJson,
  resolveOfflinePathAliases,
  setActiveOfflineUser,
  setOfflineResourceAlias,
} from "@/infrastructure/offline";

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("offline-first save client", () => {
  afterEach(() => {
    setOnline(true);
    setActiveOfflineUser(null);
  });

  it("returns cached JSON when the network is unavailable", async () => {
    setActiveOfflineUser("offline-cache-user");
    await cacheJsonResponse("/api/campaigns", { items: [{ id: "cached-campaign" }] });
    setOnline(false);

    await expect(
      offlineRequestJson<{ items: Array<{ id: string }> }>("/api/campaigns"),
    ).resolves.toEqual({ items: [{ id: "cached-campaign" }] });
  });

  it("queues character draft saves in order while offline", async () => {
    setActiveOfflineUser("offline-character-user");
    setOnline(false);

    const created = await offlineRequestJson<{ id: string }>(
      "/api/campaigns/campaign-1/characters",
      {
        method: "POST",
        body: JSON.stringify({ name: "Ari", metadata: {} }),
      },
    );
    await offlineRequestJson(`/api/characters/${created.id}/abilities`, {
      method: "PUT",
      body: JSON.stringify({ str: 12, dex: 14, con: 10, int: 16, wis: 13, cha: 8 }),
    });

    const mutations = await listOfflineMutations();
    expect(created.id).toBeTruthy();
    expect(mutations).toHaveLength(2);
    expect(mutations[0]?.resource).toEqual({ kind: "character", id: created.id });
    expect(mutations[1]?.url).toBe(`/api/characters/${created.id}/abilities`);
    expect(mutations.every((mutation) => mutation.state === "pending")).toBe(true);
  });

  it("remaps temporary ids to the cloud id for later requests", () => {
    setOfflineResourceAlias(
      "alias-user",
      { kind: "character", id: "temporary-character" },
      "cloud-character",
    );
    expect(
      resolveOfflinePathAliases(
        "alias-user",
        "/api/characters/temporary-character/creation/skills",
      ),
    ).toBe("/api/characters/cloud-character/creation/skills");
  });
});
