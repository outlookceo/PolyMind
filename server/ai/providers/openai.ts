import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import type {
  AgentCallInput,
  ChatResult,
  LLMProviderAdapter,
  ProviderError,
  ProviderValidationInput,
  StreamChunk
} from "@/server/ai/providers/types";
import { ProviderAdapterError } from "@/server/ai/providers/types";
import { normalizeMessages } from "@/server/ai/providers/openai-compatible";

export class OpenAIAdapter implements LLMProviderAdapter {
  id = "openai" as const;
  displayName = "OpenAI";
  defaultBaseUrl = "https://api.openai.com/v1";
  defaultModel = "gpt-4.1-mini";

  async validateKey(input: ProviderValidationInput) {
    await this.chat({
      provider: input.provider,
      model: input.model ?? this.defaultModel,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl ?? this.defaultBaseUrl,
      systemPrompt: "You are validating an API key. Reply with ok.",
      messages: [{ role: "user", content: "Say ok." }],
      temperature: 0,
      maxTokens: 4
    });

    return { ok: true as const };
  }

  async chat(input: AgentCallInput): Promise<ChatResult> {
    const client = this.createClient(input);

    try {
      const completion = await client.chat.completions.create({
        model: input.model,
        messages: normalizeMessages(input.systemPrompt, input.messages) as ChatCompletionMessageParam[],
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        ...(input.extraBody ?? {})
      });
      const message = completion.choices[0]?.message;

      return {
        content: message?.content ?? "",
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens
        },
        raw: completion
      };
    } catch (error) {
      throw new ProviderAdapterError(normalizeOpenAIError(error));
    }
  }

  async *streamChat(input: AgentCallInput): AsyncIterable<StreamChunk> {
    const client = this.createClient(input);

    try {
      const stream = await client.chat.completions.create({
        model: input.model,
        messages: normalizeMessages(input.systemPrompt, input.messages) as ChatCompletionMessageParam[],
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        stream: true,
        stream_options: { include_usage: true },
        ...(input.extraBody ?? {})
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content ?? undefined;
        if (content || chunk.usage) {
          yield {
            type: "delta",
            content,
            usage: {
              promptTokens: chunk.usage?.prompt_tokens,
              completionTokens: chunk.usage?.completion_tokens,
              totalTokens: chunk.usage?.total_tokens
            },
            raw: chunk
          };
        }
      }

      yield { type: "done" };
    } catch (error) {
      yield {
        type: "error",
        error: normalizeOpenAIError(error)
      };
    }
  }

  private createClient(input: AgentCallInput) {
    return new OpenAI({
      apiKey: input.apiKey,
      baseURL: input.baseUrl ?? this.defaultBaseUrl
    });
  }
}

function normalizeOpenAIError(error: unknown): ProviderError {
  const maybeError = error as {
    status?: number;
    code?: string;
    message?: string;
  };
  const status = maybeError.status;

  return {
    provider: "OpenAI",
    status,
    code: maybeError.code,
    message:
      maybeError.message ??
      (status === 401
        ? "OpenAI API Key 无效或未授权。"
        : status === 404
          ? "OpenAI 模型不存在。"
          : "OpenAI 请求失败。"),
    retryable: status === 429 || Boolean(status && status >= 500)
  };
}
