import { readServerSentEvents } from "@/shared/serverSentEvents";

export interface DmStreamOptions {
  signal: AbortSignal;
  onDelta(text: string): void;
  onReset(): void;
  onSaved(): void;
}

/** Only a terminal complete event is an accepted, persisted reply. Never retry this POST. */
export async function requestDmStream<T>(
  url: string,
  body: unknown,
  options: DmStreamOptions,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  if (!response.ok) {
    const value = (await response.json().catch(() => null)) as {
      error?: { message?: string } | string;
    } | null;
    throw new Error(
      typeof value?.error === "string"
        ? value.error
        : value?.error?.message || `Request failed (${response.status}).`,
    );
  }
  if (!response.body || !response.headers.get("Content-Type")?.includes("text/event-stream")) {
    await response.body?.cancel();
    throw new Error(
      "The response could not be streamed. Refresh the conversation before sending again.",
    );
  }
  for await (const event of readServerSentEvents(response.body, options.signal)) {
    const value: unknown = JSON.parse(event.data);
    switch (event.event) {
      case "delta":
        if (typeof value !== "string") throw new Error("Invalid response stream.");
        options.onDelta(value);
        break;
      case "reset":
        options.onReset();
        break;
      case "saved":
        options.onSaved();
        break;
      case "complete":
        if (!value || typeof value !== "object") throw new Error("Invalid completed response.");
        // Same trusted application DTO boundary as requestJson; partial text never becomes a DTO.
        return value as T;
      case "error":
        throw new Error(
          typeof value === "string" ? value : "The Dungeon Master reply was interrupted.",
        );
    }
  }
  throw new Error(
    "The reply was interrupted. Refresh the conversation before sending again; saved messages and resolved actions are preserved.",
  );
}
