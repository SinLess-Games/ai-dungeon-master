import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  enqueueGameEventPostprocess,
  type BackgroundJob,
} from "@/infrastructure/cloudflare/backgroundJobs";

describe("Cloudflare live runtime", () => {
  it("declares the campaign room as a SQLite Durable Object", () => {
    const path = fileURLToPath(new URL("../../wrangler.jsonc", import.meta.url));
    const config = JSON.parse(readFileSync(path, "utf8")) as {
      durable_objects?: { bindings?: Array<{ name: string; class_name: string }> };
      exports?: Record<string, { type: string; storage: string }>;
      migrations?: unknown;
    };

    expect(config.durable_objects?.bindings).toContainEqual({
      name: "CAMPAIGN_ROOM",
      class_name: "CampaignRoom",
    });
    expect(config.exports?.CampaignRoom).toEqual({
      type: "durable-object",
      storage: "sqlite",
    });
    expect(config.migrations).toBeUndefined();
  });

  it("creates a typed background game-event job when a queue is bound", async () => {
    const send = vi.fn(async (_job: BackgroundJob) => undefined);
    const queue = { send } as unknown as Queue<BackgroundJob>;

    await enqueueGameEventPostprocess(queue, {
      campaignId: "campaign-1",
      sessionId: "session-1",
      eventId: "event-7",
    });

    expect(send).toHaveBeenCalledTimes(1);
    const job = send.mock.calls[0]?.[0];
    expect(job).toMatchObject({
      type: "game.event.postprocess",
      campaignId: "campaign-1",
      sessionId: "session-1",
      eventId: "event-7",
    });
    expect(Number.isNaN(Date.parse(job?.enqueuedAt ?? ""))).toBe(false);
  });

  it("does not fail when background queues are intentionally unbound", async () => {
    await expect(
      enqueueGameEventPostprocess(undefined, {
        campaignId: "campaign-1",
        sessionId: "session-1",
        eventId: "event-1",
      }),
    ).resolves.toBeUndefined();
  });
});
