import { describe, expect, it, vi } from "vitest";
import {
  generateOpenAICompatibleText,
  type WorkersAIBinding,
} from "../../src/infrastructure/ai/openaiCompatible";

type WorkersAIRequest = Parameters<WorkersAIBinding["run"]>[1];

describe("Workers AI text generation", () => {
  it("disables Gemma 4 thinking so synchronous calls return user-visible content", async () => {
    const run = vi.fn(async (_model: string, _input: WorkersAIRequest) => ({
      id: "completion-1",
      object: "chat.completion",
      choices: [
        {
          message: {
            role: "assistant",
            content: "The road disappears into the storm.",
          },
        },
      ],
    }));

    const binding: WorkersAIBinding = { run };
    const text = await generateOpenAICompatibleText(
      {
        AI: binding,
        AI_GAME_MODEL: "@cf/google/gemma-4-26b-a4b-it",
      },
      {
        model: "@cf/google/gemma-4-26b-a4b-it",
        system: "You are the Dungeon Master.",
        prompt: "I follow the road.",
      },
    );

    expect(text).toBe("The road disappears into the storm.");
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(
      "@cf/google/gemma-4-26b-a4b-it",
      expect.objectContaining({
        chat_template_kwargs: { enable_thinking: false },
      }),
    );
  });

  it("does not send Gemma-specific chat-template settings to other Workers AI models", async () => {
    const run = vi.fn(async (_model: string, _input: WorkersAIRequest) => ({ response: "Ready." }));
    const binding: WorkersAIBinding = { run };

    await generateOpenAICompatibleText(
      { AI: binding },
      {
        model: "@cf/meta/llama-3.1-8b-instruct",
        system: "System",
        prompt: "Prompt",
      },
    );

    const request = run.mock.calls[0]?.[1];
    expect(request).toBeDefined();
    expect(request).not.toHaveProperty("chat_template_kwargs");
  });
});
