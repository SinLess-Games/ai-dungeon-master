import { readServerSentEvents } from "@/shared/serverSentEvents";

export interface WorkersAIBinding {
  run(
    model: string,
    input: {
      messages: Array<{ role: "system" | "user"; content: string }>;
      stream?: boolean;
      temperature?: number;
      max_tokens?: number;
      chat_template_kwargs?: {
        enable_thinking?: boolean;
      };
    },
  ): Promise<unknown>;
}

export interface OpenAICompatibleEnv {
  /**
   * Cloudflare Workers AI binding. This is the preferred production provider
   * because it uses the account's included Workers AI allocation and requires
   * no separate model API key.
   */
  AI?: WorkersAIBinding;

  /** Optional fallback for another OpenAI-compatible provider. */
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_DEVBLOG_MODEL?: string;
  AI_GAME_MODEL?: string;
}

export interface GenerateTextInput {
  system: string;
  prompt: string;
  temperature?: number;
  /** Optional provider-specific model override for this workflow. */
  model?: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

interface WorkersAITextResponse {
  response?: string;
  result?: {
    response?: string;
  };
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export const DEFAULT_WORKERS_AI_DEVBLOG_MODEL = "@cf/google/gemma-4-26b-a4b-it";

function extractWorkersAIText(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") {
    throw new Error("Workers AI returned an empty response.");
  }

  const response = value as WorkersAITextResponse;
  const content =
    response.response?.trim() ||
    response.result?.response?.trim() ||
    response.choices?.[0]?.message?.content?.trim();

  if (!content) throw new Error("Workers AI returned an empty response.");
  return content;
}

function usesGemma4(model: string): boolean {
  return model.startsWith("@cf/google/gemma-4-");
}

async function generateWorkersAIText(
  env: OpenAICompatibleEnv,
  input: GenerateTextInput,
): Promise<string> {
  if (!env.AI) throw new Error("Workers AI binding is unavailable.");

  const model =
    input.model?.trim() || env.AI_DEVBLOG_MODEL?.trim() || DEFAULT_WORKERS_AI_DEVBLOG_MODEL;
  input.signal?.throwIfAborted();
  const response = await env.AI.run(model, {
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.prompt },
    ],
    temperature: input.temperature ?? 0.5,
    max_tokens: input.maxTokens ?? 2600,
    ...(usesGemma4(model)
      ? {
          // Gemma 4 can spend the completion budget on internal reasoning and
          // return no assistant content. The campaign/devblog flows need a
          // user-visible answer, so follow Cloudflare's recommended binding
          // example and disable thinking for synchronous text generation.
          chat_template_kwargs: { enable_thinking: false },
        }
      : {}),
  });

  input.signal?.throwIfAborted();
  return extractWorkersAIText(response);
}

async function generateOpenAIProviderText(
  env: OpenAICompatibleEnv,
  input: GenerateTextInput,
): Promise<string> {
  if (!env.AI_API_KEY) throw new Error("AI_API_KEY is not configured.");

  const baseUrl = (env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = input.model?.trim() || env.AI_DEVBLOG_MODEL?.trim() || "gpt-5-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    ...(input.signal ? { signal: input.signal } : {}),
    headers: {
      Authorization: `Bearer ${env.AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
      temperature: input.temperature ?? 0.6,
      max_tokens: input.maxTokens,
    }),
  });

  const body = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

  if (!response.ok) {
    throw new Error(body?.error?.message || `AI provider returned HTTP ${response.status}.`);
  }

  const content = body?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI provider returned an empty response.");
  return content;
}

/**
 * Generate text for an application workflow.
 *
 * Provider order:
 *   1. Cloudflare Workers AI binding (free allocation, no separate AI key)
 *   2. Optional OpenAI-compatible API fallback when AI_API_KEY is configured
 */
export async function generateOpenAICompatibleText(
  env: OpenAICompatibleEnv,
  input: GenerateTextInput,
): Promise<string> {
  if (env.AI) return generateWorkersAIText(env, input);
  if (env.AI_API_KEY) return generateOpenAIProviderText(env, input);

  throw new Error(
    "No AI provider is configured. Add the Cloudflare Workers AI binding or configure AI_API_KEY.",
  );
}

/** Actual provider deltas, never a simulated typewriter over a buffered completion. */
export async function streamOpenAICompatibleText(
  env: OpenAICompatibleEnv,
  input: GenerateTextInput,
  onDelta: (text: string) => Promise<void>,
): Promise<string> {
  input.signal?.throwIfAborted();
  const model =
    input.model?.trim() ||
    env.AI_DEVBLOG_MODEL?.trim() ||
    (env.AI ? DEFAULT_WORKERS_AI_DEVBLOG_MODEL : "gpt-5-mini");
  const request = {
    messages: [
      { role: "system" as const, content: input.system },
      { role: "user" as const, content: input.prompt },
    ],
    stream: true,
    temperature: input.temperature ?? 0.5,
    max_tokens: input.maxTokens ?? 2600,
    ...(env.AI && usesGemma4(model) ? { chat_template_kwargs: { enable_thinking: false } } : {}),
  };
  let body: ReadableStream<Uint8Array>;
  if (env.AI) {
    const result = await env.AI.run(model, request);
    if (!(result instanceof ReadableStream))
      throw new Error("AI provider did not return a stream.");
    body = result;
  } else {
    if (!env.AI_API_KEY) throw new Error("No AI provider is configured.");
    const baseUrl = (env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      ...(input.signal ? { signal: input.signal } : {}),
      headers: { Authorization: `Bearer ${env.AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, model }),
    });
    if (
      !response.ok ||
      !response.body ||
      !response.headers.get("Content-Type")?.includes("text/event-stream")
    ) {
      await response.body?.cancel();
      throw new Error(`AI streaming request failed (HTTP ${response.status}).`);
    }
    body = response.body;
  }
  let text = "";
  let completed = false;
  for await (const event of readServerSentEvents(body, input.signal)) {
    if (event.data.trim() === "[DONE]") {
      completed = true;
      break;
    }
    const value: unknown = JSON.parse(event.data);
    if (!value || typeof value !== "object") throw new Error("Invalid AI stream event.");
    const frame = value as {
      response?: unknown;
      error?: unknown;
      choices?: Array<{ delta?: { content?: unknown }; finish_reason?: string | null }>;
    };
    if (event.event === "error" || frame.error) throw new Error("AI stream failed.");
    const choice = frame.choices?.[0];
    if (choice?.finish_reason && choice.finish_reason !== "stop") {
      throw new Error("AI stream ended without a complete reply.");
    }
    if (choice?.finish_reason === "stop") completed = true;
    const delta = typeof frame.response === "string" ? frame.response : choice?.delta?.content;
    if (typeof delta !== "string" || !delta) continue;
    text += delta;
    if (text.length > 20_000) throw new Error("AI reply exceeds the size limit.");
    await onDelta(delta);
  }
  input.signal?.throwIfAborted();
  if (!completed || !text.trim()) throw new Error("AI stream ended before completing a reply.");
  return text.trim();
}
