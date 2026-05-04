import { getCurrentUser } from "@/lib/server/auth";
import { handleApiError, parseJson } from "@/lib/server/api";
import { createSseResponse } from "@/lib/server/sse";
import { askAgentSchema } from "@/lib/server/validation";
import { askAgent } from "@/server/ai/orchestrator/ask-agent";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const { id } = await context.params;
    const input = await parseJson(request, askAgentSchema);

    return createSseResponse(
      askAgent({
        userId: user.id,
        spaceId: id,
        agentId: input.agentId,
        userMessage: input.userMessage
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
