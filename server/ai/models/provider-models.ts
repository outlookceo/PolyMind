export const PROVIDER_MODEL_PRESETS = {
  openai: [
    { label: "GPT-4.1", value: "gpt-4.1" },
    { label: "GPT-4.1 mini", value: "gpt-4.1-mini" }
  ],
  kimi: [
    { label: "Kimi K2.5", value: "kimi-k2.5" },
    { label: "Kimi K2 Turbo Preview", value: "kimi-k2-turbo-preview" },
    { label: "Moonshot v1 8k", value: "moonshot-v1-8k" },
    { label: "Moonshot v1 32k", value: "moonshot-v1-32k" },
    { label: "Moonshot v1 128k", value: "moonshot-v1-128k" }
  ],
  minimax: [
    { label: "MiniMax M2.7", value: "MiniMax-M2.7" },
    { label: "MiniMax M2.7 Highspeed", value: "MiniMax-M2.7-highspeed" },
    { label: "MiniMax M2.5", value: "MiniMax-M2.5" },
    { label: "MiniMax M2.5 Highspeed", value: "MiniMax-M2.5-highspeed" },
    { label: "abab6.5s Chat", value: "abab6.5s-chat" }
  ],
  deepseek: [
    { label: "DeepSeek Chat", value: "deepseek-chat" },
    { label: "DeepSeek Reasoner", value: "deepseek-reasoner" },
    { label: "DeepSeek V4 Flash", value: "deepseek-v4-flash" },
    { label: "DeepSeek V4 Pro", value: "deepseek-v4-pro" }
  ],
  "openai-compatible": [],
  anthropic: [],
  gemini: []
} as const;

export const PROVIDER_BASE_URL_HINTS = {
  openai: "https://api.openai.com/v1",
  kimi: "https://api.moonshot.ai/v1",
  minimax: "https://api.minimax.io/v1",
  deepseek: "https://api.deepseek.com",
  "openai-compatible": "https://your-compatible-provider.com/v1",
  anthropic: "Reserved for future Anthropic adapter",
  gemini: "Reserved for future Gemini adapter"
} as const;

export const PROVIDER_OPTIONS = [
  { label: "OpenAI", value: "openai" },
  { label: "Kimi", value: "kimi" },
  { label: "MiniMax", value: "minimax" },
  { label: "DeepSeek", value: "deepseek" },
  { label: "OpenAI-compatible", value: "openai-compatible" }
] as const;
