import type { Context, Env } from "hono";
import { streamSSE } from "hono/streaming";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface DmResponseStream {
  signal: AbortSignal;
  delta(text: string): Promise<void>;
  reset(): Promise<void>;
  saved(): Promise<void>;
}

/** Auth/input checks run before this boundary; only this requesting player receives drafts. */
export function respondWithDmStream<E extends Env, T>(
  c: Context<E>,
  work: (stream?: DmResponseStream) => Promise<T>,
  status: ContentfulStatusCode = 200,
) {
  if (!c.req.header("Accept")?.includes("text/event-stream")) {
    return work().then((result) => c.json(result, status));
  }
  c.header("Content-Encoding", "identity");
  c.header("X-Accel-Buffering", "no");
  const response = streamSSE(c, async (output) => {
    const controller = new AbortController();
    const signal = AbortSignal.any([
      controller.signal,
      c.req.raw.signal,
      AbortSignal.timeout(180_000),
    ]);
    output.onAbort(() => controller.abort());
    const emit = async (event: string, value: unknown) => {
      signal.throwIfAborted();
      await output.writeSSE({ event, data: JSON.stringify(value) });
    };
    try {
      await emit("status", "The Dungeon Master is thinking…");
      const result = await work({
        signal,
        delta: (text) => emit("delta", text),
        reset: () => emit("reset", null),
        saved: () => emit("saved", null),
      });
      await emit("complete", result);
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("AI DM response stream interrupted", { error });
        await output.writeSSE({
          event: "error",
          data: JSON.stringify(
            "The reply was interrupted. Refresh the conversation before sending again; saved messages and resolved actions are preserved.",
          ),
        });
      }
    }
  });
  // streamSSE installs no-cache; private transcripts must not be stored by intermediaries.
  response.headers.set("Cache-Control", "private, no-store, no-transform");
  response.headers.set("Vary", "Accept");
  return response;
}
