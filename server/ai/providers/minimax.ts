import { OpenAICompatibleAdapter } from "@/server/ai/providers/openai-compatible";

export class MiniMaxAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super({
      id: "minimax",
      displayName: "MiniMax",
      defaultBaseUrl: "https://api.minimax.io/v1",
      defaultModel: "MiniMax-M2.7"
    });
  }
}
