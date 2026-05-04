import type { LLMProviderAdapter, ProviderId } from "@/server/ai/providers/types";
import { AnthropicAdapter } from "@/server/ai/providers/anthropic";
import { DeepSeekAdapter } from "@/server/ai/providers/deepseek";
import { GeminiAdapter } from "@/server/ai/providers/gemini";
import { KimiAdapter } from "@/server/ai/providers/kimi";
import { MiniMaxAdapter } from "@/server/ai/providers/minimax";
import { OpenAIAdapter } from "@/server/ai/providers/openai";
import { OpenAICompatibleAdapter } from "@/server/ai/providers/openai-compatible";

export function normalizeProviderId(provider: string): ProviderId {
  const normalized = provider.trim().toLowerCase().replace(/\s+/g, "-");

  if (normalized === "openai-compatible" || normalized === "openai-compatible-api") {
    return "openai-compatible";
  }
  if (normalized === "openai") return "openai";
  if (normalized === "kimi" || normalized === "moonshot") return "kimi";
  if (normalized === "minimax") return "minimax";
  if (normalized === "deepseek") return "deepseek";
  if (normalized === "anthropic") return "anthropic";
  if (normalized === "gemini" || normalized === "google-gemini") return "gemini";

  return "openai-compatible";
}

export function getProviderAdapter(provider: string): LLMProviderAdapter {
  const providerId = normalizeProviderId(provider);

  switch (providerId) {
    case "openai":
      return new OpenAIAdapter();
    case "kimi":
      return new KimiAdapter();
    case "minimax":
      return new MiniMaxAdapter();
    case "deepseek":
      return new DeepSeekAdapter();
    case "openai-compatible":
      return new OpenAICompatibleAdapter();
    case "anthropic":
      return new AnthropicAdapter();
    case "gemini":
      return new GeminiAdapter();
  }
}
