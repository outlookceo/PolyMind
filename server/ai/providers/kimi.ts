import { OpenAICompatibleAdapter } from "@/server/ai/providers/openai-compatible";

export class KimiAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super({
      id: "kimi",
      displayName: "Kimi",
      defaultBaseUrl: "https://api.moonshot.ai/v1",
      defaultModel: "kimi-k2.5"
    });
  }
}
