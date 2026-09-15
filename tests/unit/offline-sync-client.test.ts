import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cacheJsonResponse,
  flushOfflineMutations,
  listOfflineMutations,
  offlineRequestJson,
  queueOfflineMutation,
  resolveOfflinePathAliases,
  setActiveOfflineUser,
  setOfflineResourceAlias,
  setResourceVersion,
} from "@/infrastructure/offline";

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("offline-first save client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it("advances the base version across ordered replays for the same resource", async () => {
    setActiveOfflineUser("ordered-replay-user");
    const resource = { kind: "campaign" as const, id: "campaign-ordered" };
    await setResourceVersion(resource, 10);
    await queueOfflineMutation({
      id: "ordered-mutation-0001",
      method: "PATCH",
      url: "/api/campaigns/campaign-ordered",
      body: JSON.stringify({ name: "First edit" }),
      resource,
      baseVersion: 10,
      forceLocal: false,
    });
    await queueOfflineMutation({
      id: "ordered-mutation-0002",
      method: "PATCH",
      url: "/api/campaigns/campaign-ordered",
      body: JSON.stringify({ name: "Second edit" }),
      resource,
      baseVersion: 10,
      forceLocal: false,
    });
    setOnline(true);

    const replayBaseVersions: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (url === "/api/sync/bootstrap") return new Response(null, { status: 401 });

      const headers = new Headers(init?.headers);
      replayBaseVersions.push(headers.get("X-Endless-Codex-Base-Version") ?? "");
      const version = replayBaseVersions.length === 1 ? 11 : 12;
      return new Response(JSON.stringify({ id: resource.id }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Endless-Codex-Resource-Version": String(version),
        },
      });
    });

    await flushOfflineMutations();

    expect(replayBaseVersions).toEqual(["10", "11"]);
    expect(await listOfflineMutations()).toHaveLength(0);
  });

  it("keeps a mutation pending when another tab already owns its server reservation", async () => {
    setActiveOfflineUser("reservation-retry-user");
    await queueOfflineMutation({
      id: "reservation-mutation-0001",
      method: "PATCH",
      url: "/api/campaigns/campaign-reservation",
      body: JSON.stringify({ name: "Queued edit" }),
      resource: { kind: "campaign", id: "campaign-reservation" },
      baseVersion: 3,
      forceLocal: false,
    });
    setOnline(true);

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (url === "/api/sync/bootstrap") return new Response(null, { status: 401 });
      return new Response(
        JSON.stringify({
          error: {
            code: "OFFLINE_SYNC_MUTATION_IN_PROGRESS",
            message: "This save is already being synchronized by another request.",
          },
        }),
        { status: 425, headers: { "Content-Type": "application/json" } },
      );
    });

    await flushOfflineMutations();

    const [mutation] = await listOfflineMutations();
    expect(mutation?.state).toBe("pending");
    expect(mutation?.attempts).toBe(1);
    expect(mutation?.lastError).toContain("another tab");
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
