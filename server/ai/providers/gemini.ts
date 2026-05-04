import type { ChatResult, LLMProviderAdapter } from "@/server/ai/providers/types";

export class GeminiAdapter implements LLMProviderAdapter {
  id = "gemini" as const;
  displayName = "Gemini";
  defaultModel = "gemini-2.5-pro";

  async validateKey(): Promise<{ ok: true }> {
    throw new Error("Gemini adapter is reserved but not implemented yet.");
  }

  async chat(): Promise<ChatResult> {
    throw new Error("Gemini adapter is reserved but not implemented yet.");
  }

  async *streamChat() {
    yield {
      type: "error" as const,
      error: {
        provider: this.displayName,
        message: "Gemini adapter is reserved but not implemented yet.",
        retryable: false
      }
    };
  }
}
