import { describe, expect, it, vi } from "vitest";
import {
  enqueueGameEventPostprocess,
  processBackgroundJobBatch,
  type BackgroundJob,
} from "@/infrastructure/cloudflare/backgroundJobs";

function message(body: BackgroundJob) {
  return {
    id: "message-1",
    timestamp: new Date("2026-09-07T19:10:00.000Z"),
    body,
    attempts: 1,
    ack: vi.fn(),
    retry: vi.fn(),
  };
}

describe("Cloudflare background jobs", () => {
  it("does nothing when the optional producer binding is unavailable", async () => {
    await expect(
      enqueueGameEventPostprocess(undefined, {
        campaignId: "campaign-1",
        sessionId: "session-1",
        eventId: "event-1",
      }),
    ).resolves.toBeUndefined();
  });

  it("enqueues committed game events with an explicit job type", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const queue = { send } as unknown as Queue<BackgroundJob>;

    await enqueueGameEventPostprocess(queue, {
      campaignId: "campaign-1",
      sessionId: "session-1",
      eventId: "event-1",
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "game.event.postprocess",
        campaignId: "campaign-1",
        sessionId: "session-1",
        eventId: "event-1",
        enqueuedAt: expect.any(String),
      }),
    );
  });

  it("caches the event cursor, broadcasts it, and acknowledges the message", async () => {
    const first = vi.fn().mockResolvedValue({
      id: "event-1",
      campaign_id: "campaign-1",
      session_id: "session-1",
      sequence: 42,
      event_type: "combat.attack",
      occurred_at: 1_788_806_400,
      actor_id: "hero-1",
      source_id: "sword-1",
      target_ids: JSON.stringify(["goblin-1"]),
    });
    const bind = vi.fn(() => ({ first }));
    const prepare = vi.fn(() => ({ bind }));
    const put = vi.fn().mockResolvedValue(undefined);
    const publish = vi.fn().mockResolvedValue(2);
    const getByName = vi.fn(() => ({ publish }));

    const job: BackgroundJob = {
      type: "game.event.postprocess",
      campaignId: "campaign-1",
      sessionId: "session-1",
      eventId: "event-1",
      enqueuedAt: "2026-09-07T19:10:00.000Z",
    };
    const queued = message(job);

    await processBackgroundJobBatch(
      {
        queue: "endless-codex-background",
        messages: [queued],
      } as unknown as MessageBatch<BackgroundJob>,
      {
        DB: { prepare } as unknown as D1Database,
        RUNTIME_CACHE: { put } as unknown as KVNamespace,
        CAMPAIGN_ROOM: { getByName } as unknown as DurableObjectNamespace,
      },
    );

    expect(prepare).toHaveBeenCalledOnce();
    expect(bind).toHaveBeenCalledWith("event-1", "campaign-1", "session-1");
    expect(put).toHaveBeenCalledWith(
      "campaign:campaign-1:event-cursor",
      expect.stringContaining('"sequence":42'),
      { expirationTtl: 86_400 },
    );
    expect(getByName).toHaveBeenCalledWith("campaign-1");
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "game.event",
        campaignId: "campaign-1",
        payload: expect.objectContaining({
          eventId: "event-1",
          sequence: 42,
          eventType: "combat.attack",
          actorId: "hero-1",
          sourceId: "sword-1",
          targetIds: ["goblin-1"],
        }),
      }),
    );
    expect(queued.ack).toHaveBeenCalledOnce();
    expect(queued.retry).not.toHaveBeenCalled();
  });

  it("retries instead of acknowledging when post-processing fails", async () => {
    const first = vi.fn().mockResolvedValue(null);
    const bind = vi.fn(() => ({ first }));
    const prepare = vi.fn(() => ({ bind }));
    const job: BackgroundJob = {
      type: "game.event.postprocess",
      campaignId: "campaign-1",
      sessionId: "session-1",
      eventId: "missing-event",
      enqueuedAt: "2026-09-07T19:10:00.000Z",
    };
    const queued = message(job);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      await processBackgroundJobBatch(
        {
          queue: "endless-codex-background",
          messages: [queued],
        } as unknown as MessageBatch<BackgroundJob>,
        { DB: { prepare } as unknown as D1Database },
      );
    } finally {
      errorSpy.mockRestore();
    }

    expect(queued.retry).toHaveBeenCalledOnce();
    expect(queued.ack).not.toHaveBeenCalled();
  });
});
