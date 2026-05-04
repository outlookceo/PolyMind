export type ProviderId =
  | "openai"
  | "kimi"
  | "minimax"
  | "deepseek"
  | "openai-compatible"
  | "anthropic"
  | "gemini";

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  name?: string;
};

export type TokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ProviderError = {
  provider: string;
  status?: number;
  code?: string;
  message: string;
  retryable: boolean;
};

export type StreamChunk = {
  type: "delta" | "done" | "error";
  content?: string;
  reasoningContent?: string;
  usage?: TokenUsage;
  raw?: unknown;
  error?: ProviderError;
};

export type ProviderValidationInput = {
  provider: string;
  apiKey: string;
  model?: string;
  baseUrl?: string | null;
  headers?: Record<string, string>;
};

export type AgentCallInput = {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string | null;
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  extraBody?: Record<string, unknown>;
  streamOptions?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export type ChatResult = {
  content: string;
  reasoningContent?: string;
  usage?: TokenUsage;
  raw?: unknown;
};

export interface LLMProviderAdapter {
  id: ProviderId;
  displayName: string;
  defaultBaseUrl?: string;
  defaultModel: string;
  validateKey(input: ProviderValidationInput): Promise<{ ok: true }>;
  chat(input: AgentCallInput): Promise<ChatResult>;
  streamChat(input: AgentCallInput): AsyncIterable<StreamChunk>;
}

export class ProviderAdapterError extends Error {
  constructor(public providerError: ProviderError) {
    super(providerError.message);
  }
}
