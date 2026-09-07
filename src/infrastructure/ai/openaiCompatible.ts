export interface WorkersAIBinding {
  run(
    model: string,
    input: {
      messages: Array<{ role: "system" | "user"; content: string }>;
      temperature?: number;
      max_tokens?: number;
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

  /**
   * Optional fallback for another OpenAI-compatible provider. The weekly
   * devblog does not require this when the Workers AI binding is available.
   */
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_DEVBLOG_MODEL?: string;
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

async function generateWorkersAIText(
  env: OpenAICompatibleEnv,
  input: {
    system: string;
    prompt: string;
    temperature?: number;
  },
): Promise<string> {
  if (!env.AI) throw new Error("Workers AI binding is unavailable.");

  const model = env.AI_DEVBLOG_MODEL?.trim() || DEFAULT_WORKERS_AI_DEVBLOG_MODEL;
  const response = await env.AI.run(model, {
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.prompt },
    ],
    temperature: input.temperature ?? 0.5,
    max_tokens: 2600,
  });

  return extractWorkersAIText(response);
}

async function generateOpenAIProviderText(
  env: OpenAICompatibleEnv,
  input: {
    system: string;
    prompt: string;
    temperature?: number;
  },
): Promise<string> {
  if (!env.AI_API_KEY) throw new Error("AI_API_KEY is not configured.");

  const baseUrl = (env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = env.AI_DEVBLOG_MODEL?.trim() || "gpt-5-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
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
  input: {
    system: string;
    prompt: string;
    temperature?: number;
  },
): Promise<string> {
  if (env.AI) return generateWorkersAIText(env, input);
  if (env.AI_API_KEY) return generateOpenAIProviderText(env, input);

  throw new Error(
    "No AI provider is configured. Add the Cloudflare Workers AI binding or configure AI_API_KEY.",
  );
}
