import { OpenAICompatibleAdapter } from "@/server/ai/providers/openai-compatible";

export class DeepSeekAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super({
      id: "deepseek",
      displayName: "DeepSeek",
      defaultBaseUrl: "https://api.deepseek.com",
      defaultModel: "deepseek-chat"
    });
  }
}
