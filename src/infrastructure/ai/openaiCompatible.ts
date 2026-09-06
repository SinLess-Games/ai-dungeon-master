export interface OpenAICompatibleEnv {
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

export async function generateOpenAICompatibleText(
  env: OpenAICompatibleEnv,
  input: {
    system: string;
    prompt: string;
    temperature?: number;
  },
): Promise<string> {
  if (!env.AI_API_KEY) {
    throw new Error("AI_API_KEY is not configured.");
  }

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
  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return content;
}
