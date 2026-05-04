import type {
  AgentCallInput,
  ChatMessage,
  ChatResult,
  LLMProviderAdapter,
  ProviderError,
  ProviderId,
  ProviderValidationInput,
  StreamChunk,
  TokenUsage
} from "@/server/ai/providers/types";
import { ProviderAdapterError } from "@/server/ai/providers/types";

type CompatibleAdapterOptions = {
  id?: ProviderId;
  displayName?: string;
  defaultBaseUrl?: string;
  defaultModel?: string;
};

type CompatibleChoice = {
  message?: {
    content?: string | null;
    reasoning_content?: string | null;
    reasoningContent?: string | null;
    thinking?: string | null;
  };
  delta?: {
    content?: string | null;
    reasoning_content?: string | null;
    reasoningContent?: string | null;
    thinking?: string | null;
  };
};

type CompatibleResponse = {
  choices?: CompatibleChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
};

export class OpenAICompatibleAdapter implements LLMProviderAdapter {
  id: ProviderId;
  displayName: string;
  defaultBaseUrl: string;
  defaultModel: string;

  constructor(options: CompatibleAdapterOptions = {}) {
    this.id = options.id ?? "openai-compatible";
    this.displayName = options.displayName ?? "OpenAI-compatible";
    this.defaultBaseUrl = options.defaultBaseUrl ?? "https://api.openai.com/v1";
    this.defaultModel = options.defaultModel ?? "gpt-4.1-mini";
  }

  async validateKey(input: ProviderValidationInput) {
    await this.chat({
      provider: input.provider,
      model: input.model ?? this.defaultModel,
      apiKey: input.apiKey,
      baseUrl: input.baseUrl ?? this.defaultBaseUrl,
      systemPrompt: "You are validating an API key. Reply with ok.",
      messages: [{ role: "user", content: "Say ok." }],
      temperature: 0,
      maxTokens: 4,
      headers: input.headers
    });

    return { ok: true as const };
  }

  async chat(input: AgentCallInput): Promise<ChatResult> {
    const response = await this.request(input, false);
    const payload = (await response.json()) as CompatibleResponse;

    if (!response.ok || payload.error) {
      throw new ProviderAdapterError(
        normalizeProviderError(this.displayName, response.status, payload)
      );
    }

    const message = payload.choices?.[0]?.message;

    return {
      content: stripThinkTags(message?.content ?? ""),
      reasoningContent:
        message?.reasoning_content ?? message?.reasoningContent ?? message?.thinking ?? undefined,
      usage: normalizeUsage(payload.usage),
      raw: payload
    };
  }

  async *streamChat(input: AgentCallInput): AsyncIterable<StreamChunk> {
    let response: Response;

    try {
      response = await this.request(input, true);
    } catch (error) {
      yield {
        type: "error",
        error: normalizeUnknownError(this.displayName, error)
      };
      return;
    }

    if (!response.ok || !response.body) {
      const payload = await safeReadJson(response);
      yield {
        type: "error",
        error: normalizeProviderError(this.displayName, response.status, payload)
      };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (!trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            yield { type: "done" };
            return;
          }

          const parsed = safeParseJson(data);
          if (!parsed) continue;

          const compatible = parsed as CompatibleResponse;
          if (compatible.error) {
            yield {
              type: "error",
              error: normalizeProviderError(this.displayName, response.status, compatible)
            };
            return;
          }

          const delta = compatible.choices?.[0]?.delta;
          const content = stripThinkTags(delta?.content ?? "");
          const reasoningContent =
            delta?.reasoning_content ?? delta?.reasoningContent ?? delta?.thinking ?? undefined;

          if (content || reasoningContent || compatible.usage) {
            yield {
              type: "delta",
              content,
              reasoningContent,
              usage: normalizeUsage(compatible.usage),
              raw: compatible
            };
          }
        }
      }

      yield { type: "done" };
    } catch (error) {
      yield {
        type: "error",
        error: normalizeUnknownError(this.displayName, error)
      };
    }
  }

  private async request(input: AgentCallInput, stream: boolean) {
    const baseUrl = trimTrailingSlash(input.baseUrl ?? this.defaultBaseUrl);
    const url = `${baseUrl}/chat/completions`;
    const body = {
      model: input.model,
      messages: normalizeMessages(input.systemPrompt, input.messages),
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      stream,
      ...(stream && input.streamOptions ? { stream_options: input.streamOptions } : {}),
      ...(input.extraBody ?? {})
    };

    return fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        ...(input.headers ?? {})
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000)
    });
  }
}

export function normalizeMessages(systemPrompt: string, messages: ChatMessage[]) {
  const systemMessage: ChatMessage = { role: "system", content: systemPrompt };
  return [systemMessage, ...messages].map((message) => ({
    role: message.role,
    content: message.content,
    ...(message.name ? { name: message.name } : {})
  }));
}

export function normalizeProviderError(
  provider: string,
  status: number | undefined,
  payload: unknown
): ProviderError {
  const maybePayload = payload as CompatibleResponse | undefined;
  const code = maybePayload?.error?.code ?? maybePayload?.error?.type;
  const message =
    maybePayload?.error?.message ??
    (status === 401
      ? "API Key 无效或未授权。"
      : status === 403
        ? "Provider 权限不足。"
        : status === 404
          ? "模型不存在或 baseUrl 错误。"
          : status === 429
            ? "Provider 速率限制，请稍后重试。"
            : status && status >= 500
              ? "Provider 服务异常，请稍后重试。"
              : "Provider 请求失败。");

  return {
    provider,
    status,
    code,
    message,
    retryable: status === 429 || Boolean(status && status >= 500)
  };
}

export function normalizeUnknownError(provider: string, error: unknown): ProviderError {
  return {
    provider,
    message:
      error instanceof Error
        ? error.message
        : "网络请求失败，请检查网络、baseUrl 或 Provider 服务状态。",
    retryable: true
  };
}

function normalizeUsage(usage?: CompatibleResponse["usage"]): TokenUsage | undefined {
  if (!usage) return undefined;

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens
  };
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function safeParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    return undefined;
  }
}

function stripThinkTags(content: string) {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, "").trimStart();
}
