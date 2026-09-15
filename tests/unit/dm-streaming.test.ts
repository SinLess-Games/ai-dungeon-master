import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { streamOpenAICompatibleText } from "../../src/infrastructure/ai/openaiCompatible";
import { readServerSentEvents } from "../../src/shared/serverSentEvents";
import { respondWithDmStream } from "../../src/modules/campaigns/server/dmResponseStream";
import { requestDmStream } from "../../src/modules/campaigns/client/dmStreamApi";

const encoder = new TextEncoder();
const frame = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;
function body(text: string) {
  const bytes = encoder.encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      // Split every UTF-8 character and SSE separator across transport chunks.
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  });
}
const input = { system: "Narrate", prompt: "Continue" };
afterEach(() => vi.unstubAllGlobals());

describe("AI DM streaming", () => {
  it("decodes fragmented UTF-8, CRLF, comments and multiline data", async () => {
    const events = [];
    for await (const event of readServerSentEvents(
      body(": keepalive\r\nevent: delta\r\ndata: café 🐉\r\ndata: second line\r\n\r\n"),
    ))
      events.push(event);
    expect(events).toEqual([{ event: "delta", data: "café 🐉\nsecond line" }]);
  });

  it("rejects oversized and incomplete SSE frames", async () => {
    for (const text of ["data: partial", `data: ${"a".repeat(65_537)}\n\n`]) {
      await expect(
        (async () => {
          for await (const _event of readServerSentEvents(body(text))) {
            /* consume */
          }
        })(),
      ).rejects.toThrow();
    }
  });

  it("forwards Workers AI tokens before completion and cancels the upstream reader", async () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const cancel = vi.fn();
    const upstream = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value;
      },
      cancel,
    });
    const run = vi.fn(async () => upstream);
    const deltas: string[] = [];
    const result = streamOpenAICompatibleText({ AI: { run } }, input, async (text) => {
      deltas.push(text);
    });
    controller.enqueue(encoder.encode(frame({ response: "The gate " })));
    await vi.waitFor(() => expect(deltas).toEqual(["The gate "]));
    controller.enqueue(encoder.encode(frame({ response: "opens." }) + "data: [DONE]\n\n"));
    await expect(result).resolves.toBe("The gate opens.");
    expect(run).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ stream: true, chat_template_kwargs: { enable_thinking: false } }),
    );
    expect(cancel).toHaveBeenCalled();
  });

  it("streams OpenAI-compatible content without leaking reasoning or metadata", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          body(
            frame({ choices: [{ delta: { role: "assistant", reasoning_content: "secret" } }] }) +
              frame({ choices: [{ delta: { content: "Hello 🐉" } }] }) +
              frame({ choices: [{ delta: {}, finish_reason: "stop" }] }) +
              "data: [DONE]\n\n",
          ),
          { headers: { "Content-Type": "text/event-stream" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const deltas: string[] = [];
    await expect(
      streamOpenAICompatibleText(
        { AI_API_KEY: "test-only", AI_BASE_URL: "https://provider.test/v1" },
        input,
        async (text) => {
          deltas.push(text);
        },
      ),
    ).resolves.toBe("Hello 🐉");
    expect(deltas).toEqual(["Hello 🐉"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://provider.test/v1/chat/completions",
      expect.objectContaining({ body: expect.stringContaining('"stream":true') }),
    );
  });

  it.each([
    frame({ response: "unfinished" }),
    frame({ response: "unfinished" }) + frame({ choices: [{ finish_reason: "length" }] }),
    frame({ error: "provider credentials must not reach the client" }),
    "data: [DONE]\n\n",
  ])("does not accept failed, truncated, or empty provider replies", async (text) => {
    await expect(
      streamOpenAICompatibleText({ AI: { run: async () => body(text) } }, input, async () => {}),
    ).rejects.toThrow();
  });

  it("aborts a stalled upstream stream", async () => {
    const cancel = vi.fn();
    const controller = new AbortController();
    const result = streamOpenAICompatibleText(
      { AI: { run: async () => new ReadableStream({ cancel }) } },
      { ...input, signal: controller.signal },
      async () => {},
    );
    controller.abort();
    await expect(result).rejects.toThrow();
    expect(cancel).toHaveBeenCalled();
  });

  it("negotiates SSE, delivers saved/delta/reset, and only returns the complete DTO", async () => {
    const app = new Hono().post("/reply", (c) =>
      respondWithDmStream(
        c,
        async (stream) => {
          await stream?.saved();
          await stream?.delta("Rejected draft");
          await stream?.reset();
          await stream?.delta("Accepted");
          return { dmMessage: { content: "Accepted" } };
        },
        201,
      ),
    );
    const callbacks = {
      signal: new AbortController().signal,
      onDelta: vi.fn(),
      onReset: vi.fn(),
      onSaved: vi.fn(),
    };
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const response = await app.request(url, init);
      expect(response.headers.get("Cache-Control")).toContain("no-store");
      return response;
    });
    await expect(requestDmStream("http://localhost/reply", {}, callbacks)).resolves.toEqual({
      dmMessage: { content: "Accepted" },
    });
    expect(callbacks.onDelta.mock.calls).toEqual([["Rejected draft"], ["Accepted"]]);
    expect(callbacks.onSaved).toHaveBeenCalledTimes(1);
    expect(callbacks.onReset).toHaveBeenCalledTimes(1);
    const legacy = await app.request("/reply", { method: "POST" });
    expect(legacy.status).toBe(201);
    expect(await legacy.json()).toEqual({ dmMessage: { content: "Accepted" } });
  });

  it("sanitizes server failures after headers without returning a completed result", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const app = new Hono().post("/reply", (c) =>
      respondWithDmStream(c, async (stream) => {
        await stream?.saved();
        await stream?.delta("Partial");
        throw new Error("private provider secret");
      }),
    );
    const response = await app.request("/reply", {
      method: "POST",
      headers: { Accept: "text/event-stream" },
    });
    const text = await response.text();
    expect(text).toContain("event: error");
    expect(text).not.toContain("private provider secret");
    expect(text).not.toContain("event: complete");
    log.mockRestore();
  });

  it("does not treat browser EOF as a saved DM reply or automatically retry", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(body('event: delta\ndata: "Partial"\n\n'), {
          headers: { "Content-Type": "text/event-stream" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      requestDmStream(
        "/reply",
        {},
        { signal: new AbortController().signal, onDelta() {}, onReset() {}, onSaved() {} },
      ),
    ).rejects.toThrow("interrupted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
