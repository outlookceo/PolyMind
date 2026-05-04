import type { ChatResult, LLMProviderAdapter } from "@/server/ai/providers/types";

export class AnthropicAdapter implements LLMProviderAdapter {
  id = "anthropic" as const;
  displayName = "Anthropic";
  defaultModel = "claude-sonnet-4-5";

  async validateKey(): Promise<{ ok: true }> {
    throw new Error("Anthropic adapter is reserved but not implemented yet.");
  }

  async chat(): Promise<ChatResult> {
    throw new Error("Anthropic adapter is reserved but not implemented yet.");
  }

  async *streamChat() {
    yield {
      type: "error" as const,
      error: {
        provider: this.displayName,
        message: "Anthropic adapter is reserved but not implemented yet.",
        retryable: false
      }
    };
  }
}
